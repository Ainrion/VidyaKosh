import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple enrollment system that works with existing tables only
// This is a fallback if the full enrollment system isn't set up

// GET /api/enrollment-codes/use-simple - Validate simple enrollment (course access)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only students can enroll
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can enroll in courses' }, { status: 403 })
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, school_id, created_by')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if student is in the same school as the course
    if (profile.school_id !== course.school_id) {
      return NextResponse.json({ 
        error: 'You can only join courses from your school' 
      }, { status: 403 })
    }

    // Check if student is already enrolled
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'You are already enrolled in this course' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      valid: true,
      course: course,
      student: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email
      },
      message: 'You can enroll in this course'
    })

  } catch (error) {
    console.error('Error in simple enrollment validation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/enrollment-codes/use-simple - Enroll student directly in course
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only students can enroll
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can enroll in courses' }, { status: 403 })
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, school_id, created_by')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if student is in the same school as the course
    if (profile.school_id !== course.school_id) {
      return NextResponse.json({ 
        error: 'You can only join courses from your school' 
      }, { status: 403 })
    }

    // Check if student is already enrolled
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'You are already enrolled in this course' 
      }, { status: 400 })
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: user.id
      })
      .select()
      .single()

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      return NextResponse.json({ 
        error: 'Failed to enroll in course',
        details: enrollmentError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully enrolled in ${course.title}`,
      enrollment: enrollment,
      course: {
        id: course.id,
        title: course.title,
        description: course.description
      },
      student: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email
      }
    })

  } catch (error) {
    console.error('Error in simple enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
