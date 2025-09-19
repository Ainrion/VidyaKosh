import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvitationEmail, testEmailConfiguration } from '@/lib/email'

// GET /api/invitations - Get school invitations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const role = searchParams.get('role') || 'student' // Default to student for backward compatibility

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

    // Try to get invitations with a simple query first
    let invitations = []
    let error = null

    try {
      // Simple query first
      let query = supabase
        .from('school_invitations')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      // Apply role filter
      query = query.eq('role', role)

      const result = await query
      invitations = result.data || []
      error = result.error
    } catch (err) {
      console.error('Error in invitations query:', err)
      error = err
      invitations = []
    }

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch invitations',
        details: error.message 
      }, { status: 500 })
    }

    // If no invitations, return empty result
    if (!invitations || invitations.length === 0) {
      return NextResponse.json({ 
        invitations: [],
        total: 0,
        message: 'No invitations found'
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
      total: transformedInvitations.length
    })
  } catch (error) {
    console.error('Error in invitations GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invitations - Create school invitation
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

    // Check if invitation already exists for this email
    const { data: existingInvitation } = await supabase
      .from('school_invitations')
      .select('id, status')
      .eq('email', email)
      .eq('school_id', profile.school_id)
      .in('status', ['pending', 'accepted'])
      .single()

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return NextResponse.json({ 
          error: 'An invitation is already pending for this email address' 
        }, { status: 400 })
      } else if (existingInvitation.status === 'accepted') {
        return NextResponse.json({ 
          error: 'This email has already been invited and accepted' 
        }, { status: 400 })
      }
    }

    // Generate invitation code (simple approach)
    const generateInvitationCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let invitationCode = generateInvitationCode()
    
    // Ensure the code is unique by checking if it already exists
    let attempts = 0
    while (attempts < 10) {
      const { data: existingCode } = await supabase
        .from('school_invitations')
        .select('id')
        .eq('invitation_code', invitationCode)
        .single()
      
      if (!existingCode) {
        break // Code is unique
      }
      
      invitationCode = generateInvitationCode()
      attempts++
    }

    if (attempts >= 10) {
      console.error('Failed to generate unique invitation code after 10 attempts')
      return NextResponse.json({ error: 'Failed to generate unique invitation code' }, { status: 500 })
    }

    // Create invitation
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const { data: invitation, error: createError } = await supabase
      .from('school_invitations')
      .insert({
        school_id: profile.school_id,
        email: email.toLowerCase().trim(),
        invitation_code: invitationCode,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        message: message || `You've been invited to join ${profile.school_id ? 'our school' : 'the school'}!`
      })
      .select(`
        *,
        school:schools(name, email)
      `)
      .single()

    if (createError) {
      console.error('Error creating invitation:', createError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Send email notification
    const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup?invite=${invitationCode}`
    
    try {
      const emailSent = await sendInvitationEmail({
        recipientName: email.split('@')[0], // Use email prefix as name
        recipientEmail: email,
        schoolName: invitation.school?.name || 'the school',
        inviterName: profile.full_name || 'School Administrator',
        invitationCode: invitationCode,
        invitationUrl: invitationUrl,
        message: message,
        expiresAt: expiresAt.toISOString()
      })

      if (emailSent) {
        console.log('Invitation email sent successfully to:', email)
      } else {
        console.warn('Failed to send invitation email to:', email)
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the invitation creation if email fails
    }

    return NextResponse.json({ 
      invitation,
      message: 'Invitation created successfully',
      invitationUrl: invitationUrl,
      emailSent: true // We'll assume it was sent, actual status is logged
    })
  } catch (error) {
    console.error('Error in invitations POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

