import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get the user's profile to check role and school
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can invite teachers' }, { status: 403 })
    }

    if (!profile.school_id) {
      return NextResponse.json({ error: 'Admin must be assigned to a school' }, { status: 400 })
    }

    const body = await request.json()
    const { email, message } = body

    if (!email) {
      return NextResponse.json({ error: 'Teacher email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if teacher is already registered
    const { data: existingUser, error: checkUserError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', email)
      .single()

    if (!checkUserError && existingUser) {
      if (existingUser.role === 'teacher') {
        return NextResponse.json({ 
          error: 'A teacher with this email is already registered' 
        }, { status: 400 })
      } else {
        return NextResponse.json({ 
          error: 'A user with this email already exists with a different role' 
        }, { status: 400 })
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation, error: checkInvitationError } = await supabase
      .from('school_invitations')
      .select('id, status, expires_at')
      .eq('email', email)
      .eq('school_id', profile.school_id)
      .eq('role', 'teacher')
      .eq('status', 'pending')
      .single()

    if (!checkInvitationError && existingInvitation) {
      // Check if invitation is still valid
      const now = new Date()
      const expiresAt = new Date(existingInvitation.expires_at)
      
      if (now < expiresAt) {
        return NextResponse.json({ 
          error: 'A pending invitation already exists for this teacher' 
        }, { status: 400 })
      }
    }

    // Generate invitation code
    const invitationCode = nanoid(12)
    
    // Set expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const { data: invitation, error: createError } = await supabase
      .from('school_invitations')
      .insert({
        email: email,
        invitation_code: invitationCode,
        role: 'teacher',
        school_id: profile.school_id,
        invited_by: profile.id,
        expires_at: expiresAt.toISOString(),
        message: message || `You've been invited to join our school as a teacher on Riven LMS.`,
        status: 'pending'
      })
      .select(`
        *,
        school:schools(*),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
      `)
      .single()

    if (createError) {
      console.error('Error creating teacher invitation:', createError)
      return NextResponse.json({ 
        error: 'Failed to create invitation' 
      }, { status: 500 })
    }

    // TODO: Send email invitation (implement email service)
    // For now, we'll return the invitation details
    
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        code: invitation.invitation_code,
        expiresAt: invitation.expires_at,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?invite=${invitation.invitation_code}`
      },
      message: 'Teacher invitation created successfully'
    })

  } catch (error) {
    console.error('Error in teacher invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get the user's profile to check role and school
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view teacher invitations' }, { status: 403 })
    }

    // Get all teacher invitations for this school
    const { data: invitations, error: fetchError } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(*),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
      `)
      .eq('school_id', profile.school_id)
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching teacher invitations:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch invitations' 
      }, { status: 500 })
    }

    return NextResponse.json({ invitations })

  } catch (error) {
    console.error('Error fetching teacher invitations:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
