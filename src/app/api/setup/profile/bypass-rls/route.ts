import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS completely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Service role key not configured' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body = await request.json()
    const { user_id, full_name, role, school_id } = body

    if (!user_id || !full_name || !role) {
      return NextResponse.json({ 
        error: 'User ID, full name, and role are required' 
      }, { status: 400 })
    }

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be admin, teacher, or student' 
      }, { status: 400 })
    }

    // Handle school_id - if it's 'temp-no-school', set to null
    let schoolId: string | null = school_id
    if (school_id === 'temp-no-school') {
      schoolId = null
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        error: 'Profile already exists' 
      }, { status: 400 })
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id)
    
    if (userError || !userData.user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Create the profile using service role (bypasses RLS completely)
    const { data: profile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user_id,
        email: userData.user.email!,
        full_name: full_name.trim(),
        role: role as 'admin' | 'teacher' | 'student',
        school_id: schoolId,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Service role profile creation error:', createError)
      return NextResponse.json({ 
        error: createError.message || 'Failed to create profile' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: profile,
      message: 'Profile created successfully using service role (RLS bypassed)' 
    })
  } catch (error) {
    console.error('Error in bypass RLS profile creation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
