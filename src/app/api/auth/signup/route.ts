import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, fullName, role, schoolId, schoolName, invitationCode } = body

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
        const { data: invitationData, error: invitationError } = await supabase
          .from('school_invitations')
          .select(`
            *,
            school:schools(*),
            invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
          `)
          .eq('invitation_code', invitationCode)
          .eq('email', email)
          .eq('role', role)
          .eq('status', 'pending')
          .single()

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
        if (now > expiresAt) {
          console.error('Invitation expired:', { now, expiresAt })
          return NextResponse.json({ 
            error: 'Invitation code has expired. Please contact your school administrator for a new invitation.' 
          }, { status: 400 })
        }

        // Use the school from the invitation
        schoolId = invitation.school_id
        console.log('Invitation validated successfully, school ID:', schoolId)
      }
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to create user profile' 
      }, { status: 500 })
    }

    // If student or teacher signed up with invitation, update invitation status
    if ((role === 'student' || role === 'teacher') && invitationCode && invitation) {
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
    }

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      profile: profile,
      message: 'User created successfully' 
    })
  } catch (error) {
    console.error('Error in signup:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
