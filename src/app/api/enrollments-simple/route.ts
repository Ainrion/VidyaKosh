import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/enrollments-simple - Simplified enrollments API
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

    // Only admins and teachers can view enrollments
    if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Try to get enrollments with a very simple query
    let enrollments = []
    let error = null

    try {
      // Simple query - just get all enrollments for now
      const { data, error: queryError } = await supabase
        .from('enrollments')
        .select('*')
        .limit(100) // Limit to prevent large responses

      if (queryError) {
        console.error('Enrollments query error:', queryError)
        error = queryError
      } else {
        enrollments = data || []
      }
    } catch (err) {
      console.error('Enrollments table might not exist:', err)
      error = err
    }

    // If enrollments table doesn't exist or has no data, return empty result
    if (error || !enrollments || enrollments.length === 0) {
      return NextResponse.json({ 
        enrollments: [],
        total: 0,
        message: 'No enrollments found or enrollments table not set up',
        debug: {
          error: error instanceof Error ? error.message : 'No error',
          tableExists: !error,
          enrollmentsCount: enrollments?.length || 0
        }
      })
    }

    // Get unique student and course IDs
    const studentIds = [...new Set(enrollments.map(e => e.student_id))]
    const courseIds = [...new Set(enrollments.map(e => e.course_id))]

    // Fetch student and course data
    let students: any[] = []
    let courses: any[] = []

    try {
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds)
        students = studentsData || []
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    }

    try {
      if (courseIds.length > 0) {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds)
        courses = coursesData || []
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
    }

    // Create lookup maps
    const studentsMap = new Map(students.map(s => [s.id, s]))
    const coursesMap = new Map(courses.map(c => [c.id, c]))

    // Transform to expected format with actual data
    const transformedEnrollments = enrollments.map(enrollment => {
      const student = studentsMap.get(enrollment.student_id)
      const course = coursesMap.get(enrollment.course_id)

      return {
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        student_name: student?.full_name || 'Unknown Student',
        student_email: student?.email || 'unknown@example.com',
        course_id: enrollment.course_id,
        course_title: course?.title || 'Unknown Course',
        status: enrollment.status || 'active',
        enrolled_at: enrollment.enrolled_at || enrollment.created_at,
        enrollment_method: enrollment.enrollment_method || 'direct',
        enrolled_by: null,
        enrolled_by_name: 'Unknown',
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        notes: null,
        completed_at: null
      }
    })

    return NextResponse.json({ 
      enrollments: transformedEnrollments,
      total: transformedEnrollments.length,
      message: 'Enrollments fetched successfully'
    })

  } catch (error) {
    console.error('Error in enrollments-simple GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
