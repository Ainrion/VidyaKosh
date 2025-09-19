import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/debug-enrollments - Debug enrollment data structure
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Check if enrollments table exists and get basic info
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .limit(5)

    // Check if profiles table exists and get students
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, school_id')
      .eq('role', 'student')
      .limit(5)

    // Check if courses table exists
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, school_id, created_by')
      .limit(5)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: profile.role,
        school_id: profile.school_id
      },
      tables: {
        enrollments: {
          exists: !enrollmentsError,
          error: enrollmentsError?.message,
          count: enrollments?.length || 0,
          sample: enrollments || []
        },
        students: {
          exists: !studentsError,
          error: studentsError?.message,
          count: students?.length || 0,
          sample: students || []
        },
        courses: {
          exists: !coursesError,
          error: coursesError?.message,
          count: courses?.length || 0,
          sample: courses || []
        }
      },
      debug: {
        enrollmentsError: enrollmentsError,
        studentsError: studentsError,
        coursesError: coursesError
      }
    })
  } catch (error) {
    console.error('Error in debug-enrollments GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

