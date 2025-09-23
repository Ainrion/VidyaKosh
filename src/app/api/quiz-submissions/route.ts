import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/quiz-submissions - Submit a quiz
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { quiz_id, student_id, answers } = body
    
    console.log('Quiz submission request:', { quiz_id, student_id, answersCount: answers?.length })

    // 1. Authenticate user and get profile
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

    // 2. Get quiz details and check enrollment
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, course_id')
      .eq('id', quiz_id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', quiz.course_id)
      .single()

    console.log('Enrollment check:', { enrollment, enrollmentError, course_id: quiz.course_id, student_id: user.id })

    if (enrollmentError || !enrollment) {
      console.log('Enrollment failed:', enrollmentError)
      return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 })
    }

    // 3. Check if student has already submitted this quiz
    const { data: existingSubmission, error: existingError } = await supabase
      .from('quiz_submissions')
      .select('id')
      .eq('quiz_id', quiz_id)
      .eq('student_id', user.id)
      .single()

    if (existingSubmission) {
      console.log('Student has already submitted this quiz:', existingSubmission.id)
      return NextResponse.json({ 
        submission_id: existingSubmission.id,
        message: 'You have already submitted this quiz',
        already_submitted: true
      }, { status: 200 })
    }

    // 4. Get quiz questions to validate answers
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer')
      .eq('quiz_id', quiz_id)

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch quiz questions' }, { status: 500 })
    }

    let score = 0
    const quizAnswers = answers.map((answer: any) => {
      const question = questions.find(q => q.id === answer.question_id)
      const is_correct = question?.correct_answer === answer.answer
      if (is_correct) {
        score++
      }
      return {
        question_id: answer.question_id,
        student_answer: answer.answer,
        correct_answer: question?.correct_answer || null,
        is_correct: is_correct
      }
    })

    // 5. Create quiz submission
    const { data: submission, error: submissionError } = await supabase
      .from('quiz_submissions')
      .insert({
        quiz_id,
        student_id: user.id,
        score,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (submissionError || !submission) {
      console.error('Error creating quiz submission:', submissionError)
      return NextResponse.json({ error: 'Failed to create quiz submission' }, { status: 500 })
    }

    // 6. Insert quiz answers
    const answersToInsert = quizAnswers.map((qa: any) => ({
      ...qa,
      submission_id: submission.id
    }))

    const { error: answersError } = await supabase
      .from('quiz_answers')
      .insert(answersToInsert)

    if (answersError) {
      console.error('Error inserting quiz answers:', answersError)
      // Optionally, delete the submission if answers fail to insert
      await supabase.from('quiz_submissions').delete().eq('id', submission.id)
      return NextResponse.json({ error: 'Failed to save quiz answers' }, { status: 500 })
    }

    return NextResponse.json({ 
      submission_id: submission.id,
      score,
      message: 'Quiz submitted successfully'
    })
  } catch (error) {
    console.error('Error in quiz-submissions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/quiz-submissions - Get quiz submissions for admin/teacher dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const quizId = searchParams.get('quizId')

    // Authenticate user
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

    // Only teachers and admins can view submissions
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    let query = supabase
      .from('quiz_submissions')
      .select(`
        id,
        score,
        submitted_at,
        quiz_id,
        student_id,
        quizzes!inner (
          id,
          title,
          course_id,
          courses!inner (
            id,
            title,
            school_id,
            created_by
          )
        ),
        profiles!quiz_submissions_student_id_fkey (
          full_name,
          email
        )
      `)
      .order('submitted_at', { ascending: false })

    // Filter by course if specified
    if (courseId) {
      query = query.eq('quizzes.course_id', courseId)
    }

    // Filter by quiz if specified
    if (quizId) {
      query = query.eq('quiz_id', quizId)
    }

    // For teachers, only show submissions from their courses
    if (profile.role === 'teacher') {
      query = query.eq('quizzes.courses.created_by', user.id)
    }

    // For admins, only show submissions from their school
    if (profile.role === 'admin') {
      query = query.eq('quizzes.courses.school_id', profile.school_id)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching quiz submissions:', error)
      return NextResponse.json({ error: 'Failed to fetch quiz submissions' }, { status: 500 })
    }

    return NextResponse.json({ submissions: submissions || [] })
  } catch (error) {
    console.error('Error in quiz-submissions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}