import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/courses - Get courses for the current user
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
      .from('courses')
      .select(`
        id,
        title,
        description,
        school_id,
        created_by,
        created_at,
        archived
      `)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (profile.role === 'teacher') {
      // Teachers can only see their own courses
      query = query.eq('created_by', user.id)
    } else if (profile.role === 'admin') {
      // Admins can see all courses in their school
      query = query.eq('school_id', profile.school_id)
    } else if (profile.role === 'student') {
      // Students can see courses they're enrolled in
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)
      
      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id)
        query = query.in('id', courseIds)
      } else {
        // No enrollments, return empty result
        return NextResponse.json({ courses: [] })
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Filter by specific course if requested
    if (courseId) {
      query = query.eq('id', courseId)
    }

    const { data: courses, error } = await query

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    return NextResponse.json({ 
      courses: courses || [],
      total: courses?.length || 0
    })
  } catch (error) {
    console.error('Error in courses GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 })
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

    // Only teachers and admins can create courses
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create the course
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        title,
        description: description || null,
        school_id: profile.school_id,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating course:', createError)
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
    }

    return NextResponse.json({ 
      course,
      message: 'Course created successfully'
    })
  } catch (error) {
    console.error('Error in courses POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
