import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/quizzes/[id] - Delete a specific quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: quizId } = await params

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
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

    // Get the quiz to check permissions
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id,
        course_id,
        courses!inner (
          id,
          school_id,
          created_by
        )
      `)
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if user has permission to delete this quiz
    const course = quiz.courses[0]
    const canDelete = 
      profile.role === 'admin' || 
      (profile.role === 'teacher' && course.created_by === user.id)

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this quiz' }, { status: 403 })
    }

    // Delete the quiz (this will cascade delete quiz_questions due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (deleteError) {
      console.error('Error deleting quiz:', deleteError)
      return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Quiz deleted successfully'
    })
  } catch (error) {
    console.error('Error in quiz DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/quizzes/[id] - Get a specific quiz with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: quizId } = await params

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
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

    // Get the quiz with questions
    console.log('Fetching quiz with ID:', quizId)
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        course_id,
        created_at,
        courses!inner (
          id,
          title,
          school_id
        ),
        quiz_questions (
          id,
          question,
          options,
          correct_answer,
          order_index
        )
      `)
      .eq('id', quizId)
      .single()

    console.log('Quiz fetch result:', { quiz, quizError })

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if user has permission to view this quiz
    const course = quiz.courses[0]
    const canView = 
      profile.role === 'admin' || 
      course.school_id === profile.school_id

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions to view this quiz' }, { status: 403 })
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Error in quiz GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
