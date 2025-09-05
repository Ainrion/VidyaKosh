import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, fullName, role, schoolId } = body

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ 
        error: 'Email, password, full name, and role are required' 
      }, { status: 400 })
    }

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be admin, teacher, or student' 
      }, { status: 400 })
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

    // Ensure a school exists
    let schoolIdToUse = schoolId

    if (!schoolIdToUse) {
      // Check if any schools exist
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
        // Create default school
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        school_id: schoolIdToUse,
        full_name: fullName,
        email: email,
        role: role
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to create user profile' 
      }, { status: 500 })
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
