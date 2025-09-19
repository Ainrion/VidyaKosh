import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/enrollments/bulk - Bulk enroll students in a course
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { courseId, studentIds, enrollmentType = 'admin' } = body

    if (!courseId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Course ID and student IDs array are required' 
      }, { status: 400 })
    }

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

    // Only admins and teachers can bulk enroll students
    if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify the course exists and user has permission
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, school_id, created_by')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check permissions
    if (profile.role === 'teacher' && course.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only enroll students in your own courses' }, { status: 403 })
    } else if (profile.role === 'admin' && course.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only enroll students in courses from your school' }, { status: 403 })
    }

    // Use manual approach for bulk enrollment
    console.log('Using manual bulk enrollment approach')
    let results = []

    // First, check if enrollments table exists
    console.log('Bulk enrollment API: Checking enrollments table')
    const { data: tableCheck, error: tableError } = await supabase
      .from('enrollments')
      .select('id')
      .limit(1)

    if (tableError) {
      console.log('Bulk enrollment API: Enrollments table error:', tableError.message)
      return NextResponse.json({
        error: 'Enrollments table not found. Please run the database setup first.',
        details: tableError.message
      }, { status: 500 })
    }

    // Process each student
    console.log('Bulk enrollment API: Processing', studentIds.length, 'students')
    for (const studentId of studentIds) {
      try {
        console.log('Bulk enrollment API: Processing student:', studentId)
        
        // Check if student is in the same school
        const { data: student, error: studentError } = await supabase
          .from('profiles')
          .select('id, full_name, school_id, role')
          .eq('id', studentId)
          .single()

        if (studentError || !student) {
          results.push({
            success: false,
            student_id: studentId,
            message: 'Student not found'
          })
          continue
        }

        // Check if student is in the same school as the course
        if (student.school_id !== course.school_id) {
          results.push({
            success: false,
            student_id: studentId,
            message: 'Student is not in the same school as the course'
          })
          continue
        }

        // Check if student has the correct role
        if (student.role !== 'student') {
          results.push({
            success: false,
            student_id: studentId,
            message: 'User is not a student'
          })
          continue
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('student_id', studentId)
          .single()

        if (existingEnrollment) {
          results.push({
            success: false,
            student_id: studentId,
            message: 'Student is already enrolled in this course'
          })
          continue
        }

        // Create enrollment (use only basic columns that should exist)
        const enrollmentData: any = {
          course_id: courseId,
          student_id: studentId
        }

        // Try to add optional columns if they exist
        try {
          enrollmentData.enrolled_by = user.id
          enrollmentData.enrollment_method = enrollmentType
          enrollmentData.status = 'active'
        } catch (e) {
          console.log('Optional columns not available, using basic enrollment')
        }

        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert(enrollmentData)

        if (enrollmentError) {
          results.push({
            success: false,
            student_id: studentId,
            message: `Enrollment failed: ${enrollmentError.message}`
          })
        } else {
          results.push({
            success: true,
            student_id: studentId,
            message: 'Enrolled successfully'
          })
        }
      } catch (studentError) {
        results.push({
          success: false,
          student_id: studentId,
          message: `Error: ${studentError instanceof Error ? studentError.message : 'Unknown error'}`
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`Bulk enrollment completed: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: studentIds.length,
        successful,
        failed
      },
      message: `Bulk enrollment completed: ${successful} successful, ${failed} failed`
    })
  } catch (error) {
    console.error('Error in bulk enrollment:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}