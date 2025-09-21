import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/test-simple-enrollment - Test simple enrollment creation
export async function POST(request: NextRequest) {
  try {
    console.log('Test Simple Enrollment API: Starting')
    const supabase = await createClient()
    const body = await request.json()
    const { courseId, studentId } = body

    if (!courseId || !studentId) {
      return NextResponse.json({ 
        error: 'Course ID and Student ID are required' 
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

    console.log('Test Simple Enrollment API: Profile found:', profile)

    // Check if enrollments table exists
    console.log('Test Simple Enrollment API: Checking enrollments table')
    const { data: tableCheck, error: tableError } = await supabase
      .from('enrollments')
      .select('id')
      .limit(1)

    if (tableError) {
      console.log('Test Simple Enrollment API: Table error:', tableError.message)
      return NextResponse.json({ 
        error: 'Enrollments table not found',
        details: tableError.message
      }, { status: 500 })
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, school_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ 
        error: 'Course not found',
        details: courseError?.message
      }, { status: 404 })
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, school_id, role')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ 
        error: 'Student not found',
        details: studentError?.message
      }, { status: 404 })
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        message: 'Student is already enrolled',
        enrollment: existingEnrollment
      })
    }

    // Try to create enrollment with minimal data
    console.log('Test Simple Enrollment API: Creating enrollment')
    const { data: newEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId
      })
      .select()
      .single()

    if (enrollmentError) {
      console.log('Test Simple Enrollment API: Enrollment error:', enrollmentError.message)
      return NextResponse.json({ 
        error: 'Failed to create enrollment',
        details: enrollmentError.message
      }, { status: 500 })
    }

    console.log('Test Simple Enrollment API: Enrollment created successfully')

    return NextResponse.json({
      success: true,
      message: 'Enrollment created successfully',
      enrollment: newEnrollment,
      course: course,
      student: student
    })

  } catch (error) {
    console.error('Test Simple Enrollment API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


