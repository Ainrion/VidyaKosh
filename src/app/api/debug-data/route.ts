import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/debug-data - Debug database data
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
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get sample data from all relevant tables
    const [enrollmentsResult, studentsResult, coursesResult] = await Promise.all([
      supabase
        .from('enrollments')
        .select('*')
        .limit(10),
      supabase
        .from('profiles')
        .select('id, full_name, email, role, school_id')
        .eq('role', 'student')
        .limit(10),
      supabase
        .from('courses')
        .select('id, title, school_id, created_by')
        .limit(10)
    ])

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: profile.role,
        school_id: profile.school_id,
        full_name: profile.full_name
      },
      data: {
        enrollments: {
          count: enrollmentsResult.data?.length || 0,
          sample: enrollmentsResult.data || [],
          error: enrollmentsResult.error?.message
        },
        students: {
          count: studentsResult.data?.length || 0,
          sample: studentsResult.data || [],
          error: studentsResult.error?.message
        },
        courses: {
          count: coursesResult.data?.length || 0,
          sample: coursesResult.data || [],
          error: coursesResult.error?.message
        }
      },
      debug: {
        enrollmentsError: enrollmentsResult.error,
        studentsError: studentsResult.error,
        coursesError: coursesResult.error
      }
    })
  } catch (error) {
    console.error('Error in debug-data GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

