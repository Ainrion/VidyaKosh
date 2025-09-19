import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/invitations-simple - Get school invitations (simple version)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only admins can view invitations
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if school_invitations table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('school_invitations')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === 'PGRST205') {
      return NextResponse.json({ 
        error: 'Database table not found',
        details: 'The school_invitations table does not exist. Please run the database migration.',
        migrationNeeded: true,
        migrationFile: 'create_invitation_table.sql'
      }, { status: 500 })
    }

    // Try to get invitations with a simple query
    let invitations = []
    let error = null

    try {
      // Simple query - just get invitations for this school
      let query = supabase
        .from('school_invitations')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        console.error('Invitations query error:', queryError)
        error = queryError
      } else {
        invitations = data || []
      }
    } catch (err) {
      console.error('Invitations table might not exist:', err)
      error = err
    }

    // If invitations table doesn't exist or has no data, return empty result
    if (error || !invitations || invitations.length === 0) {
      return NextResponse.json({ 
        invitations: [],
        total: 0,
        message: 'No invitations found or invitations table not set up',
        debug: {
          error: error?.message || 'No error',
          tableExists: !error,
          invitationsCount: invitations?.length || 0
        }
      })
    }

    // Get related data separately to avoid complex joins
    const invitedByIds = [...new Set(invitations.map(i => i.invited_by).filter(Boolean))]
    const acceptedByIds = [...new Set(invitations.map(i => i.accepted_by).filter(Boolean))]

    // Fetch related profiles
    let invitedByProfiles = []
    let acceptedByProfiles = []

    try {
      if (invitedByIds.length > 0) {
        const { data: invitedData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', invitedByIds)
        invitedByProfiles = invitedData || []
      }
    } catch (err) {
      console.error('Error fetching invited by profiles:', err)
    }

    try {
      if (acceptedByIds.length > 0) {
        const { data: acceptedData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', acceptedByIds)
        acceptedByProfiles = acceptedData || []
      }
    } catch (err) {
      console.error('Error fetching accepted by profiles:', err)
    }

    // Create lookup maps
    const invitedByMap = new Map(invitedByProfiles.map(p => [p.id, p]))
    const acceptedByMap = new Map(acceptedByProfiles.map(p => [p.id, p]))

    // Transform to expected format with actual data
    const transformedInvitations = invitations.map(invitation => {
      const invitedByProfile = invitedByMap.get(invitation.invited_by)
      const acceptedByProfile = acceptedByMap.get(invitation.accepted_by)

      return {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status || 'pending',
        invitation_code: invitation.invitation_code,
        message: invitation.message,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
        accepted_at: invitation.accepted_at,
        invited_by: invitation.invited_by,
        invited_by_name: invitedByProfile?.full_name || 'Unknown',
        invited_by_email: invitedByProfile?.email || 'unknown@example.com',
        accepted_by: invitation.accepted_by,
        accepted_by_name: acceptedByProfile?.full_name || null,
        accepted_by_email: acceptedByProfile?.email || null,
        school_id: invitation.school_id,
        school_name: 'School' // We'll get this from the school_id if needed
      }
    })

    return NextResponse.json({ 
      invitations: transformedInvitations,
      total: transformedInvitations.length,
      message: 'Invitations fetched successfully'
    })

  } catch (error) {
    console.error('Error in invitations-simple GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/invitations-simple - Create school invitation (simple version)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, message, expiresInDays = 7 } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only admins can create invitations
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Generate simple invitation code
    const generateInvitationCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const invitationCode = generateInvitationCode()

    // Create invitation with simple approach
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    try {
      const { data: invitation, error: createError } = await supabase
        .from('school_invitations')
        .insert({
          school_id: profile.school_id,
          email: email.toLowerCase().trim(),
          invitation_code: invitationCode,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          message: message || `You've been invited to join our school!`,
          status: 'pending'
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Error creating invitation:', createError)
        return NextResponse.json({ 
          error: 'Failed to create invitation',
          details: createError.message 
        }, { status: 500 })
      }

      const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup?invite=${invitationCode}`

      return NextResponse.json({ 
        invitation,
        message: 'Invitation created successfully',
        invitationUrl: invitationUrl,
        invitationCode: invitationCode
      })

    } catch (error) {
      console.error('Error in invitation creation:', error)
      return NextResponse.json({ 
        error: 'Failed to create invitation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in invitations-simple POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}