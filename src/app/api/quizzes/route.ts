import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/quizzes - Get quizzes for a course
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
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get quizzes for the course with questions
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        course_id,
        created_at,
        quiz_questions (
          id,
          question,
          options,
          correct_answer,
          order_index
        )
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes:', error)
      return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
    }

    return NextResponse.json({ 
      quizzes: quizzes || [],
      total: quizzes?.length || 0
    })
  } catch (error) {
    console.error('Error in quizzes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, description, course_id, questions } = body

    if (!title || !course_id) {
      return NextResponse.json({ error: 'Title and course ID are required' }, { status: 400 })
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

    // Only teachers and admins can create quizzes
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify the course exists and user has access to it
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, school_id, created_by')
      .eq('id', course_id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user has access to this course
    if (profile.role === 'teacher' && course.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only create quizzes for your own courses' }, { status: 403 })
    }

    if (profile.role === 'admin' && course.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only create quizzes for courses in your school' }, { status: 403 })
    }

    // Create the quiz
    const { data: quiz, error: createError } = await supabase
      .from('quizzes')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        course_id: course_id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating quiz:', createError)
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
    }

    // Create quiz questions if provided
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q: any, index: number) => ({
        quiz_id: quiz.id,
        question: q.question_text || q.question,
        options: q.options || null,
        correct_answer: q.correct_answer || null,
        order_index: index + 1
      }))

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Error creating quiz questions:', questionsError)
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json({ 
      quiz,
      message: 'Quiz created successfully'
    })
  } catch (error) {
    console.error('Error in quizzes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

