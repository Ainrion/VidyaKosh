import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/invitations/validate - Validate invitation code
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 })
    }

    // Get invitation details
    const { data: invitation, error } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(name, email, address, phone),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(full_name, email)
      `)
      .eq('invitation_code', code)
      .eq('status', 'pending')
      .single()

    if (error || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation code' 
      }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      invitation,
      valid: true,
      message: 'Invitation is valid'
    })
  } catch (error) {
    console.error('Error in invitation validation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invitations/validate - Accept invitation and create account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { invitationCode, email, password, fullName } = body

    if (!invitationCode || !email || !password || !fullName) {
      return NextResponse.json({ 
        error: 'Invitation code, email, password, and full name are required' 
      }, { status: 400 })
    }

    // First, validate the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(name, email)
      `)
      .eq('invitation_code', invitationCode)
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation code' 
      }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 400 })
    }

    // Check if email matches
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ 
        error: 'Email does not match the invitation' 
      }, { status: 400 })
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student'
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json({ 
        error: authError.message || 'Signup failed' 
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'User creation failed' 
      }, { status: 500 })
    }

    // Create user profile with school access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        school_id: invitation.school_id,
        full_name: fullName,
        email: email,
        role: 'student',
        school_access_granted: true,
        school_access_granted_by: invitation.invited_by,
        school_access_granted_at: new Date().toISOString(),
        invitation_id: invitation.id
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to create user profile' 
      }, { status: 500 })
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('school_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: authData.user.id
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      // Don't fail the signup if this fails
    }

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      profile: profile,
      school: invitation.school,
      message: 'Account created successfully and school access granted' 
    })
  } catch (error) {
    console.error('Error in invitation acceptance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


