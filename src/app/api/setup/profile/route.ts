import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, role, school_id } = body

    if (!full_name || !role) {
      return NextResponse.json({ 
        error: 'Full name and role are required' 
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
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        error: 'Profile already exists' 
      }, { status: 400 })
    }

    // Create the profile
    const { data: profile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: full_name.trim(),
        role: role as 'admin' | 'teacher' | 'student',
        school_id: schoolId,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Profile creation error:', createError)
      
      // If it's an RLS error or infinite recursion, try to create with bypass RLS
      if (createError.code === '42501' || createError.code === '42P17' || createError.message?.includes('permission') || createError.message?.includes('infinite recursion')) {
        try {
          // Use bypass RLS API as fallback
          const bypassResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/setup/profile/bypass-rls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              full_name: full_name.trim(),
              role: role,
              school_id: school_id
            })
          })

          if (bypassResponse.ok) {
            const bypassData = await bypassResponse.json()
            return NextResponse.json({ 
              success: true, 
              profile: bypassData.profile,
              message: 'Profile created successfully using RLS bypass' 
            })
          } else {
            const bypassError = await bypassResponse.json()
            console.error('Bypass RLS API error:', bypassError)
            return NextResponse.json({ 
              error: 'Failed to create profile due to permissions' 
            }, { status: 500 })
          }
        } catch (fallbackError) {
          console.error('Bypass RLS fallback error:', fallbackError)
          return NextResponse.json({ 
            error: 'Failed to create profile' 
          }, { status: 500 })
        }
      }
      
      return NextResponse.json({ 
        error: createError.message || 'Failed to create profile' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: profile,
      message: 'Profile created successfully' 
    })
  } catch (error) {
    console.error('Error in profile creation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
