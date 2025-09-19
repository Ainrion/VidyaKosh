import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/students-simple - Simplified students API
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

    // Only admins and teachers can view students
    if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Try to get students with a simple query
    let students = []
    let error = null

    try {
      // Simple query - get students from the same school
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, school_id, created_at')
        .eq('role', 'student')
        .eq('school_id', profile.school_id)
        .limit(100) // Limit to prevent large responses

      if (queryError) {
        console.error('Students query error:', queryError)
        error = queryError
      } else {
        students = data || []
      }
    } catch (err) {
      console.error('Students query failed:', err)
      error = err
    }

    // Return students or empty array
    return NextResponse.json({ 
      students: students,
      total: students.length,
      message: students.length > 0 ? 'Students fetched successfully' : 'No students found',
      debug: {
        error: error?.message || 'No error',
        schoolId: profile.school_id,
        studentsCount: students.length
      }
    })

  } catch (error) {
    console.error('Error in students-simple GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

