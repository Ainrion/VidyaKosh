import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Enhanced enrollment system that tries full system first, then falls back to simple
// This provides the best user experience regardless of database setup

// GET /api/enrollment-codes/use-enhanced - Validate enrollment code with fallback
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Enrollment code is required' }, { status: 400 })
    }

    // Try the full enrollment code system first
    try {
      const { data: enrollmentCode, error } = await supabase
        .from('course_enrollment_codes')
        .select(`
          *,
          course:courses(id, title, description, school_id),
          created_by_profile:profiles!course_enrollment_codes_created_by_fkey(full_name, email)
        `)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (!error && enrollmentCode) {
        // Check if code has expired
        if (enrollmentCode.expires_at && new Date(enrollmentCode.expires_at) < new Date()) {
          return NextResponse.json({ 
            error: 'Enrollment code has expired' 
          }, { status: 400 })
        }

        // Check if code has reached max uses
        if (enrollmentCode.max_uses && enrollmentCode.current_uses >= enrollmentCode.max_uses) {
          return NextResponse.json({ 
            error: 'Enrollment code has reached maximum uses' 
          }, { status: 400 })
        }

        return NextResponse.json({ 
          code: enrollmentCode,
          valid: true,
          system: 'full',
          message: 'Enrollment code is valid'
        })
      }
    } catch (error) {
      console.log('Full enrollment system not available, trying fallback...')
    }

    // Fallback: Try to find course by simple code matching
    // This assumes the code might be a course ID or some other identifier
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id, title, description, school_id, created_by,
        created_by_profile:profiles!courses_created_by_fkey(full_name, email)
      `)
      .or(`id.eq.${code},title.ilike.%${code}%`)
      .limit(5)

    if (coursesError || !courses || courses.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid enrollment code or course not found' 
      }, { status: 404 })
    }

    // If multiple courses found, return the first one
    const course = courses[0]

    return NextResponse.json({ 
      code: {
        id: course.id,
        code: code.toUpperCase(),
        title: `Join ${course.title}`,
        description: 'Direct course enrollment',
        course: course,
        created_by_profile: course.created_by_profile,
        current_uses: 0,
        max_uses: null,
        expires_at: null,
        is_active: true
      },
      valid: true,
      system: 'simple',
      message: 'Course found for enrollment'
    })

  } catch (error) {
    console.error('Error in enhanced enrollment validation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/enrollment-codes/use-enhanced - Use enrollment code with fallback
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { code, courseId } = body

    if (!code && !courseId) {
      return NextResponse.json({ error: 'Enrollment code or course ID is required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Only students can use enrollment codes' }, { status: 403 })
    }

    // Try the full enrollment system first
    if (code) {
      try {
        const { data: result, error: useError } = await supabase
          .rpc('use_enrollment_code', {
            p_code: code.toUpperCase(),
            p_student_id: user.id
          })

        if (!useError && result && result.success) {
          return NextResponse.json({ 
            success: true,
            message: result.message,
            course_title: result.course_title,
            course_id: result.course_id,
            system: 'full',
            code_uses_remaining: result.code_uses_remaining
          })
        }

        // If the function exists but returned an error, return that error
        if (!useError && result && !result.success) {
          return NextResponse.json({ 
            error: result.error 
          }, { status: 400 })
        }
      } catch (error) {
        console.log('Full enrollment system not available, using simple fallback...')
      }
    }

    // Fallback: Simple enrollment
    const targetCourseId = courseId || code

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, school_id, created_by')
      .eq('id', targetCourseId)
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
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', course.id)
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
        course_id: course.id,
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
      course_title: course.title,
      course_id: course.id,
      system: 'simple',
      enrollment: enrollment
    })

  } catch (error) {
    console.error('Error in enhanced enrollment usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
