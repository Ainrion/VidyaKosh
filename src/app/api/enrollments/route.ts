import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/enrollments - Get enrollments for admin/teacher management
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const courseId = searchParams.get('courseId')

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

    // First, let's try a simple query to see if the enrollments table exists
    let rawEnrollments: any[] = []
    let enrollmentsError = null

    try {
      // First, get the course IDs that the user has access to
      let accessibleCourseIds = []
      
      if (profile.role === 'teacher') {
        // Get courses created by this teacher
        const { data: teacherCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('created_by', user.id)
        accessibleCourseIds = teacherCourses?.map(c => c.id) || []
      } else if (profile.role === 'admin') {
        // Get courses in the admin's school
        const { data: schoolCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('school_id', profile.school_id)
        accessibleCourseIds = schoolCourses?.map(c => c.id) || []
      }

      // If no accessible courses, return empty result
      if (accessibleCourseIds.length === 0) {
        rawEnrollments = []
        enrollmentsError = null
      } else {
        // Build the enrollments query
        let query = supabase
          .from('enrollments')
          .select(`
            id as enrollment_id,
            course_id,
            student_id,
            enrolled_at,
            enrollment_method,
            status
          `)
          .in('course_id', accessibleCourseIds)
          .order('enrolled_at', { ascending: false })

        // Filter by course if specified
        if (courseId && accessibleCourseIds.includes(courseId)) {
          query = query.eq('course_id', courseId)
        }

        // Filter by status if specified
        if (status !== 'all') {
          query = query.eq('status', status)
        }

        const result = await query
        rawEnrollments = result.data || []
        enrollmentsError = result.error
      }
    } catch (error) {
      console.error('Error in enrollments query:', error)
      enrollmentsError = error
      rawEnrollments = []
    }

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return NextResponse.json({ 
        error: 'Failed to fetch enrollments',
        details: enrollmentsError instanceof Error ? enrollmentsError.message : 'Unknown error'
      }, { status: 500 })
    }

    if (!rawEnrollments || rawEnrollments.length === 0) {
      return NextResponse.json({ 
        enrollments: [],
        total: 0,
        message: 'No enrollments found'
      })
    }

    // Get unique student and course IDs
    const studentIds = rawEnrollments ? [...new Set(rawEnrollments.map(e => e.student_id))] : []
    const courseIds = rawEnrollments ? [...new Set(rawEnrollments.map(e => e.course_id))] : []

    // Fetch related data separately to avoid complex joins
    let studentsResult: any = { data: [], error: null }
    let coursesResult: any = { data: [], error: null }

    try {
      if (studentIds.length > 0) {
        studentsResult = await supabase
          .from('profiles')
          .select('id, full_name, email, school_id')
          .in('id', studentIds)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      studentsResult.error = error
    }

    try {
      if (courseIds.length > 0) {
        coursesResult = await supabase
          .from('courses')
          .select('id, title, school_id, created_by')
          .in('id', courseIds)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      coursesResult.error = error
    }

    if (studentsResult.error) {
      console.error('Error fetching students:', studentsResult.error)
      // Continue with empty students data instead of failing
    }

    if (coursesResult.error) {
      console.error('Error fetching courses:', coursesResult.error)
      // Continue with empty courses data instead of failing
    }

    // Create maps for quick lookup
    const studentsMap = new Map((studentsResult.data || []).map((s: any) => [s.id, s]))
    const coursesMap = new Map((coursesResult.data || []).map((c: any) => [c.id, c]))

    // Transform the data to match the expected format
    const enrollments = (rawEnrollments || []).map(enrollment => {
      const student = studentsMap.get(enrollment.student_id) as any
      const course = coursesMap.get(enrollment.course_id) as any

      return {
        enrollment_id: enrollment.enrollment_id,
        student_id: enrollment.student_id,
        student_name: student?.full_name || 'Unknown',
        student_email: student?.email || 'Unknown',
        course_id: enrollment.course_id,
        course_title: course?.title || 'Unknown',
        status: enrollment.status || 'active',
        enrolled_at: enrollment.enrolled_at,
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
      enrollments,
      total: enrollments.length
    })
  } catch (error) {
    console.error('Error in enrollments GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
