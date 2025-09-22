import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/enrollment-codes - Get enrollment codes for courses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
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

    // Build query based on user role
    let query = supabase
      .from('course_enrollment_codes')
      .select(`
        *,
        course:courses(id, title, description, school_id, created_by),
        created_by_profile:profiles!course_enrollment_codes_created_by_fkey(full_name, email),
        usage:enrollment_code_usage(
          id,
          used_at,
          student_profile:profiles!enrollment_code_usage_student_id_fkey(full_name, email)
        )
      `)
      .order('created_at', { ascending: false })

    if (profile.role === 'teacher') {
      // Teachers can only see codes for their courses
      query = query.eq('course.created_by', user.id)
    } else if (profile.role === 'admin') {
      // Admins can see codes for courses in their school
      query = query.eq('course.school_id', profile.school_id)
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Filter by course if specified
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: codes, error } = await query

    if (error) {
      console.error('Error fetching enrollment codes:', error)
      return NextResponse.json({ error: 'Failed to fetch enrollment codes' }, { status: 500 })
    }

    // Filter out codes where course is null (orphaned codes)
    const validCodes = codes?.filter(code => code.course !== null) || []

    return NextResponse.json({ 
      codes: validCodes,
      total: validCodes.length
    })
  } catch (error) {
    console.error('Error in enrollment codes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/enrollment-codes - Create enrollment code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { 
      courseId, 
      title, 
      description, 
      expiresInDays, 
      maxUses 
    } = body

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
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify course exists and user has permission
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
      return NextResponse.json({ error: 'You can only create codes for your own courses' }, { status: 403 })
    } else if (profile.role === 'admin' && course.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only create codes for courses in your school' }, { status: 403 })
    } else if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Generate enrollment code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_enrollment_code')

    if (codeError) {
      console.error('Error generating enrollment code:', codeError)
      return NextResponse.json({ error: 'Failed to generate enrollment code' }, { status: 500 })
    }

    const enrollmentCode = codeData

    // Prepare expiration date
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Create enrollment code
    const { data: code, error: createError } = await supabase
      .from('course_enrollment_codes')
      .insert({
        course_id: courseId,
        code: enrollmentCode,
        created_by: user.id,
        title: title || `${course.title} Enrollment`,
        description: description || `Join ${course.title} using this code`,
        expires_at: expiresAt?.toISOString(),
        max_uses: maxUses || null
      })
      .select(`
        *,
        course:courses(title, description),
        created_by_profile:profiles!course_enrollment_codes_created_by_fkey(full_name, email)
      `)
      .single()

    if (createError) {
      console.error('Error creating enrollment code:', createError)
      return NextResponse.json({ error: 'Failed to create enrollment code' }, { status: 500 })
    }

    return NextResponse.json({ 
      code,
      message: 'Enrollment code created successfully',
      enrollmentUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/enroll?code=${enrollmentCode}`
    })
  } catch (error) {
    console.error('Error in enrollment codes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


