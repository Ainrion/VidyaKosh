import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/quiz-submissions/[id] - Get a specific quiz submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: submissionId } = await params

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
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

    // Get the submission with quiz and answer details
    console.log('Fetching submission with ID:', submissionId)
    const { data: submission, error: submissionError } = await supabase
      .from('quiz_submissions')
      .select(`
        id,
        score,
        submitted_at,
        quiz_id,
        student_id,
        profiles!quiz_submissions_student_id_fkey (
          full_name,
          email
        ),
        quizzes!inner (
          id,
          title,
          description,
          course_id,
          courses!inner (
            id,
            title,
            school_id,
            created_by
          )
        ),
        quiz_answers (
          id,
          question_id,
          student_answer,
          correct_answer,
          is_correct,
          quiz_questions (
            id,
            question,
            options
          )
        )
      `)
      .eq('id', submissionId)
      .single()

    console.log('Submission fetch result:', { submission, submissionError })

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check permissions
    const course = submission.quizzes[0].courses[0]
    console.log('Permission check:', {
      userRole: profile.role,
      userId: user.id,
      courseCreatedBy: course.created_by,
      submissionStudentId: submission.student_id,
      courseSchoolId: course.school_id,
      userSchoolId: profile.school_id
    })
    
    const canView = 
      (profile.role === 'admin' && course.school_id === profile.school_id) || 
      (profile.role === 'teacher' && course.created_by === user.id) ||
      (profile.role === 'student' && submission.student_id === user.id)

    console.log('Can view submission:', canView)

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions to view this submission' }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error in quiz submission GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
