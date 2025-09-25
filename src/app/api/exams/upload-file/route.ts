import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  uploadFileToWasabi, 
  generateExamAnswerFilePath, 
  validateFile, 
  deleteFileFromWasabi 
} from '@/lib/wasabi'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with school information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const examSessionId = formData.get('examSessionId') as string
    const questionId = formData.get('questionId') as string

    if (!file || !examSessionId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if user has permission to upload for this exam session
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(`
        student_id, 
        exam_id,
        exams (
          school_id
        )
      `)
      .eq('id', examSessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Exam session not found' }, { status: 404 })
    }

    if (sessionData.student_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Multi-tenant isolation: ensure student belongs to the same school as the exam
    const examSchoolId = sessionData.exams?.[0]?.school_id
    if (!examSchoolId || profile.school_id !== examSchoolId) {
      return NextResponse.json({ error: 'Unauthorized: Exam belongs to a different school' }, { status: 403 })
    }

    // Check if there's an existing answer file and delete it
    const { data: existingAnswer, error: existingError } = await supabase
      .from('exam_answers')
      .select('file_path')
      .eq('exam_session_id', examSessionId)
      .eq('question_id', questionId)
      .single()

    if (existingAnswer?.file_path) {
      try {
        await deleteFileFromWasabi(existingAnswer.file_path)
        console.log('Deleted existing answer file:', existingAnswer.file_path)
      } catch (deleteError) {
        console.warn('Failed to delete existing answer file:', deleteError)
        // Continue with upload even if deletion fails
      }
    }

    // Generate unique file path with school-based multi-tenant organization
    const filePath = generateExamAnswerFilePath(user.id, examSessionId, questionId, file.name, examSchoolId)

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload file to Wasabi with metadata including school isolation
    const uploadResult = await uploadFileToWasabi(fileBuffer, filePath, file.type, {
      'user-id': user.id,
      'school-id': examSchoolId,
      'exam-session-id': examSessionId,
      'question-id': questionId,
      'original-name': file.name,
      'upload-type': 'exam-answer'
    })

    // Save file info to database
    const { data: answerData, error: answerError } = await supabase
      .from('exam_answers')
      .upsert({
        exam_session_id: examSessionId,
        question_id: questionId,
        file_path: uploadResult.key, // Store the Wasabi key
        file_name: file.name,
        file_size: uploadResult.size,
        mime_type: file.type
      }, {
        onConflict: 'exam_session_id,question_id'
      })
      .select()
      .single()

    if (answerError) {
      console.error('Database error:', answerError)
      // Try to clean up uploaded file from Wasabi
      try {
        await deleteFileFromWasabi(uploadResult.key)
      } catch (error) {
        console.error('Wasabi cleanup error:', error)
      }
      return NextResponse.json({ error: 'Failed to save file info' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: answerData.id,
        name: file.name,
        size: uploadResult.size,
        url: uploadResult.url,
        path: uploadResult.key,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const answerId = searchParams.get('answerId')

    if (!answerId) {
      return NextResponse.json({ error: 'Missing answer ID' }, { status: 400 })
    }

    // Get file info
    const { data: answerData, error: answerError } = await supabase
      .from('exam_answers')
      .select('file_path, exam_session_id')
      .eq('id', answerId)
      .single()

    if (answerError || !answerData) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
    }

    // Check if user has permission to delete this file
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('student_id')
      .eq('id', answerData.exam_session_id)
      .single()

    if (sessionError || !sessionData || sessionData.student_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete file from Wasabi if it exists
    if (answerData.file_path) {
      try {
        const { deleteFileFromWasabi } = await import('@/lib/wasabi')
        await deleteFileFromWasabi(answerData.file_path)
      } catch (error) {
        console.error('Wasabi delete error:', error)
        // Continue with database cleanup even if Wasabi delete fails
      }
    }

    // Delete from database
    const { error: dbDeleteError } = await supabase
      .from('exam_answers')
      .delete()
      .eq('id', answerId)

    if (dbDeleteError) {
      console.error('Database delete error:', dbDeleteError)
      return NextResponse.json({ error: 'Failed to delete from database' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
