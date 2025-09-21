import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, fullName, joinToken } = body

    console.log('Teacher join completion request:', { 
      email, 
      fullName, 
      hasJoinToken: !!joinToken,
      password: '[HIDDEN]'
    })

    if (!email || !password || !fullName || !joinToken) {
      return NextResponse.json({ 
        error: 'Email, password, full name, and join token are required' 
      }, { status: 400 })
    }

    // Validate join token and get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(*),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
      `)
      .eq('join_token', joinToken)
      .eq('email', email)
      .eq('role', 'teacher')
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      console.error('Invalid join token:', invitationError)
      return NextResponse.json({ 
        error: 'Invalid or expired join link' 
      }, { status: 400 })
    }

    // Check if join link is expired
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    
    // Add some buffer time (5 minutes) to account for clock skew and processing time
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    const adjustedNow = new Date(now.getTime() + bufferTime)
    
    if (adjustedNow > expiresAt) {
      console.error('Join token expired:', { now, expiresAt, adjustedNow })
      return NextResponse.json({ 
        error: 'Join link has expired' 
      }, { status: 400 })
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'teacher'
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json({ 
        error: authError.message || 'Account creation failed' 
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'User creation failed' 
      }, { status: 500 })
    }

    // Create user profile
    const profileData = {
      id: authData.user.id,
      school_id: invitation.school_id,
      full_name: fullName,
      email: email,
      role: 'teacher',
      school_access_granted: true,
      school_access_granted_at: new Date().toISOString(),
      invitation_id: invitation.id
    }

    // Try to insert the profile, but if it fails due to conflict (trigger created it), update it instead
        const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    let finalProfile = profile

    if (profileError && profileError.code === '23505') {
      // Profile already exists (created by trigger), update it with correct data
      console.log('Profile exists, updating with teacher data')
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          school_id: invitation.school_id,
          full_name: fullName,
          role: 'teacher',
          school_access_granted: true,
          school_access_granted_at: new Date().toISOString(),
          invitation_id: invitation.id
        })
        .eq('id', authData.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update user profile' 
        }, { status: 500 })
      }
      
      finalProfile = updatedProfile
    } else if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to create user profile' 
      }, { status: 500 })
    }

    // Update invitation status to accepted
    const { error: updateInvitationError } = await supabase
      .from('school_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: authData.user.id
      })
      .eq('id', invitation.id)

    if (updateInvitationError) {
      console.error('Error updating invitation status:', updateInvitationError)
      // Don't fail the signup, just log the error
    }

    console.log('Teacher account created successfully:', {
      userId: authData.user.id,
      email: authData.user.email,
      schoolId: invitation.school_id
    })

    // Sign in the user immediately after account creation
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('Auto sign-in error:', signInError)
      // Still return success, user can sign in manually
      return NextResponse.json({ 
        success: true, 
        user: authData.user,
        profile: finalProfile,
        message: 'Teacher account created successfully. Please sign in to continue.',
        requiresManualSignIn: true
      })
    }

    return NextResponse.json({ 
      success: true, 
      user: signInData.user,
      profile: finalProfile,
      session: signInData.session,
      message: 'Teacher account created and signed in successfully',
      redirectTo: '/dashboard'
    })
  } catch (error) {
    console.error('Error in teacher join completion:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

