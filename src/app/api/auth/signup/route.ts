import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, fullName, role, schoolName, invitationCode } = body
    let { schoolId } = body

    console.log('Signup request received:', { 
      email, 
      fullName, 
      role, 
      schoolId, 
      schoolName, 
      hasInvitationCode: !!invitationCode,
      password: '[HIDDEN]'
    })

    if (!email || !password || !fullName || !role) {
      console.error('Missing required fields:', { email: !!email, password: !!password, fullName: !!fullName, role: !!role })
      return NextResponse.json({ 
        error: 'Email, password, full name, and role are required' 
      }, { status: 400 })
    }

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      console.error('Invalid role:', role)
      return NextResponse.json({ 
        error: 'Invalid role. Must be admin, teacher, or student' 
      }, { status: 400 })
    }

    // Handle invitation code requirements for students and teachers
    let invitation: any = null
    
    if (role === 'student' || (role === 'teacher' && invitationCode)) {
      if (role === 'student' && !invitationCode) {
        return NextResponse.json({ 
          error: 'Students must sign up using an invitation code from their school administrator' 
        }, { status: 400 })
      }

      if (invitationCode) {
        console.log('Validating invitation code:', invitationCode, 'for role:', role, 'email:', email)
        
        // Validate invitation code
        // First try with role column (new schema), fallback to old schema if column doesn't exist
        let { data: invitationData, error: invitationError } = await supabase
          .from('school_invitations')
          .select(`
            *,
            school:schools(*),
            invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
          `)
          .eq('invitation_code', invitationCode)
          .eq('email', email)
          .eq('status', 'pending')
          .single()

        // If the query failed due to missing role column, try without role filter
        if (invitationError && invitationError.code === '42703' && invitationError.message.includes('role')) {
          console.log('Role column not found, trying without role filter')
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('school_invitations')
            .select(`
              *,
              school:schools(*),
              invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
            `)
            .eq('invitation_code', invitationCode)
            .eq('email', email)
            .eq('status', 'pending')
            .single()
          
          invitationData = fallbackData
          invitationError = fallbackError
        } else if (invitationData && invitationData.role && invitationData.role !== role) {
          // If role column exists but doesn't match, return error
          console.error('Role mismatch for invitation:', { expected: role, actual: invitationData.role })
          return NextResponse.json({ 
            error: 'Invitation code is not valid for this role. Please check your invitation.' 
          }, { status: 400 })
        }

        console.log('Invitation query result:', { invitationData, invitationError })

        if (invitationError) {
          console.error('Invitation validation error:', invitationError)
          return NextResponse.json({ 
            error: 'Invalid or expired invitation code. Please check your email or contact your school administrator.' 
          }, { status: 400 })
        }

        if (!invitationData) {
          console.error('No invitation found for code:', invitationCode)
          return NextResponse.json({ 
            error: 'Invalid or expired invitation code. Please check your email or contact your school administrator.' 
          }, { status: 400 })
        }

        invitation = invitationData

        // Check if invitation is expired
        const now = new Date()
        const expiresAt = new Date(invitation.expires_at)
        
        // Add some buffer time (5 minutes) to account for clock skew and processing time
        const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
        const adjustedNow = new Date(now.getTime() + bufferTime)
        
        console.log('Signup invitation validation:', {
          invitationCode,
          email,
          role,
          now: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          adjustedNow: adjustedNow.toISOString(),
          timeRemaining: expiresAt.getTime() - now.getTime(),
          isExpired: adjustedNow > expiresAt
        })
        
        if (adjustedNow > expiresAt) {
          console.error('Invitation expired:', { now, expiresAt, adjustedNow })
          return NextResponse.json({ 
            error: 'Invitation code has expired. Please contact your school administrator for a new invitation.' 
          }, { status: 400 })
        }

        // Use the school from the invitation
        schoolId = invitation.school_id
        console.log('Invitation validated successfully, school ID:', schoolId)
      }
    }

    // Create user account with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          full_name: fullName,
          role: role
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

    // Handle school assignment/creation
    let schoolIdToUse = schoolId

    // For admin role and new school registration, schoolId should be provided from school creation
    if (!schoolIdToUse && role === 'admin' && schoolName) {
      return NextResponse.json({ 
        error: 'School must be created first for admin registration' 
      }, { status: 400 })
    }

    // For teachers, try to find existing school by name or create a new one
    if (!schoolIdToUse && role === 'teacher' && schoolName) {
      // First, try to find existing school by name (case-insensitive)
      const { data: existingSchool, error: findError } = await supabase
        .from('schools')
        .select('id, name')
        .ilike('name', schoolName.trim())
        .limit(1)
        .single()

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error finding school:', findError)
        return NextResponse.json({ 
          error: 'Failed to find school' 
        }, { status: 500 })
      }

      if (existingSchool) {
        schoolIdToUse = existingSchool.id
      } else {
        // Create new school for teacher
        const { data: newSchool, error: createError } = await supabase
          .from('schools')
          .insert({
            name: schoolName.trim(),
            address: 'To be updated',
            email: `admin@${schoolName.toLowerCase().replace(/\s+/g, '')}.edu`,
            phone: 'To be updated'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating school for teacher:', createError)
          return NextResponse.json({ 
            error: 'Failed to create school. Please contact administrator.' 
          }, { status: 500 })
        }

        schoolIdToUse = newSchool.id
      }
    }

    if (!schoolIdToUse) {
      // Check if any schools exist for fallback
      const { data: existingSchools, error: checkError } = await supabase
        .from('schools')
        .select('id')
        .limit(1)

      if (checkError) {
        console.error('Error checking schools:', checkError)
        return NextResponse.json({ 
          error: 'Failed to check schools' 
        }, { status: 500 })
      }

      if (!existingSchools || existingSchools.length === 0) {
        // Create default school for users without specific school
        const { data: newDefaultSchool, error: createError } = await supabase
          .from('schools')
          .insert({
            name: 'Default School',
            address: 'Sample Address',
            email: 'admin@defaultschool.edu',
            phone: '+1-555-0123'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating default school:', createError)
          return NextResponse.json({ 
            error: 'Failed to create default school' 
          }, { status: 500 })
        }

        schoolIdToUse = newDefaultSchool.id
      } else {
        schoolIdToUse = existingSchools[0].id
      }
    }

    // Create user profile
    const profileData: any = {
      id: authData.user.id,
      school_id: schoolIdToUse,
      full_name: fullName,
      email: email,
      role: role
    }

    // For students and teachers signing up with invitation, mark school access as granted
    if ((role === 'student' || role === 'teacher') && invitationCode && invitation) {
      profileData.school_access_granted = true
      profileData.school_access_granted_at = new Date().toISOString()
      profileData.invitation_id = invitation.id
    }

    // Use service role client for profile operations to bypass RLS
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try to insert the profile, but if it fails due to conflict (trigger created it), update it instead
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    let finalProfile = profile

    if (profileError && profileError.code === '23505') {
      // Profile already exists (created by trigger), update it with correct data
      console.log('Profile exists, updating with correct data')
      const { data: updatedProfile, error: updateError } = await serviceSupabase
        .from('profiles')
        .update({
          school_id: schoolIdToUse,
          full_name: fullName,
          role: role,
          email: email
        })
        .eq('id', authData.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update user profile',
          details: updateError.message
        }, { status: 500 })
      }
      
      finalProfile = updatedProfile
      console.log('Profile updated successfully:', finalProfile)
    } else if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to create user profile',
        details: profileError.message
      }, { status: 500 })
    } else {
      console.log('Profile created successfully:', finalProfile)
    }

    // If student or teacher signed up with invitation, update invitation status
    if ((role === 'student' || role === 'teacher') && invitationCode && invitation) {
      const { error: updateInvitationError } = await serviceSupabase
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
    }

    console.log('Signup successful, returning response:', {
      success: true,
      userId: authData.user.id,
      profileId: finalProfile?.id,
      role: finalProfile?.role,
      schoolId: finalProfile?.school_id
    })

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      profile: finalProfile,
      message: 'User created successfully',
      emailConfirmationSent: !authData.user.email_confirmed_at,
      requiresEmailConfirmation: !authData.user.email_confirmed_at
    })
  } catch (error) {
    console.error('Error in signup:', error)
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (error instanceof Error) {
      // Check for specific database errors
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        errorMessage = 'Database schema issue. Please contact administrator.'
        statusCode = 500
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'User already exists with this email.'
        statusCode = 400
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Invalid school reference. Please contact administrator.'
        statusCode = 400
      } else {
        errorMessage = error.message || 'Internal server error'
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined
    }, { status: statusCode })
  }
}
