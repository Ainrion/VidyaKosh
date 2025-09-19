import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/test-enrollments - Test endpoint to verify enrollment system
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test basic connectivity
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error',
        details: authError.message 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'No user found',
        message: 'Please log in to test enrollments'
      }, { status: 401 })
    }

    // Test profile fetch
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile error',
        details: profileError.message,
        user_id: user.id
      }, { status: 500 })
    }

    // Test enrollments table access
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id')
      .limit(1)

    if (enrollmentsError) {
      return NextResponse.json({ 
        error: 'Enrollments table error',
        details: enrollmentsError.message,
        profile: profile
      }, { status: 500 })
    }

    // Test courses table access
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(1)

    if (coursesError) {
      return NextResponse.json({ 
        error: 'Courses table error',
        details: coursesError.message,
        profile: profile
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'All tests passed!',
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile,
      tables: {
        enrollments: enrollments ? 'accessible' : 'not accessible',
        courses: courses ? 'accessible' : 'not accessible'
      }
    })
  } catch (error) {
    console.error('Error in test enrollments:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

