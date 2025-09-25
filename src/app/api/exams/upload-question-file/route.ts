import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  uploadFileToWasabi, 
  generateExamQuestionFilePath, 
  validateFile, 
  deleteFileFromWasabi,
  fileExistsInWasabi 
} from '@/lib/wasabi'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Only teachers and admins can upload question files
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Unauthorized - only teachers and admins can upload question files' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const examId = formData.get('examId') as string
    const questionId = formData.get('questionId') as string

    if (!file || !examId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if this is a temporary exam ID (during exam creation)
    const isTemporaryExam = examId.startsWith('temp-exam-')
    
    let isExamCreator = false
    let isAdmin = false
    let schoolId = profile.school_id // Default to user's school

    if (!isTemporaryExam) {
      // Check if user has permission to upload for this exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('created_by, school_id')
        .eq('id', examId)
        .single()

      if (examError || !examData) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      // Multi-tenant isolation: ensure user belongs to the same school as the exam
      if (profile.school_id !== examData.school_id) {
        return NextResponse.json({ error: 'Unauthorized: Exam belongs to a different school' }, { status: 403 })
      }

      // Check permissions: exam creator or admin from same school
      isExamCreator = examData.created_by === user.id
      isAdmin = profile.role === 'admin' && profile.school_id === examData.school_id
      schoolId = examData.school_id // Use exam's school ID

      if (!isExamCreator && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized to upload files for this exam' }, { status: 403 })
      }
    } else {
      // For temporary exams during creation, only check if user is teacher/admin
      if (!['teacher', 'admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Only teachers and admins can upload question files' }, { status: 403 })
      }
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Check if there's an existing file for this question and delete it
    const { data: existingQuestion, error: existingError } = await supabase
      .from('exam_questions')
      .select('file_path')
      .eq('id', questionId)
      .eq('exam_id', examId)
      .single()

    if (existingQuestion?.file_path) {
      try {
        await deleteFileFromWasabi(existingQuestion.file_path)
        console.log('Deleted existing file:', existingQuestion.file_path)
      } catch (deleteError) {
        console.warn('Failed to delete existing file:', deleteError)
        // Continue with upload even if deletion fails
      }
    }

    // Generate unique file path with school-based multi-tenant organization
    // Use a placeholder exam ID for temporary exams
    const actualExamId = isTemporaryExam ? 'temp-exam-creation' : examId
    const filePath = generateExamQuestionFilePath(user.id, actualExamId, questionId, file.name, schoolId)

    // Upload file to Wasabi with metadata including school isolation
    const uploadResult = await uploadFileToWasabi(fileBuffer, filePath, file.type, {
      'user-id': user.id,
      'school-id': schoolId,
      'exam-id': examId,
      'question-id': questionId,
      'original-name': file.name
    })

    if (!isTemporaryExam) {
      // Save file info to database for existing exams
      const { data: questionData, error: questionError } = await supabase
        .from('exam_questions')
        .update({
          question_text: uploadResult.url, // Store the file URL as question text
          file_path: uploadResult.key, // Store the Wasabi key
          file_name: file.name,
          file_size: uploadResult.size,
          mime_type: file.type
        })
        .eq('id', questionId)
        .eq('exam_id', examId)
        .select()
        .single()

      if (questionError) {
        console.error('Database error:', questionError)
        // Try to clean up uploaded file
        try {
          await deleteFileFromWasabi(uploadResult.key)
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError)
        }
        return NextResponse.json({ error: 'Failed to save file info' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        file: {
          id: questionData.id,
          name: file.name,
          size: uploadResult.size,
          url: uploadResult.url,
          path: uploadResult.key,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      })
    } else {
      // For temporary exams, just return the file data without database save
      return NextResponse.json({
        success: true,
        file: {
          id: questionId, // Use the temporary question ID
          name: file.name,
          size: uploadResult.size,
          url: uploadResult.url,
          path: uploadResult.key,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          isTemporary: true // Flag to indicate this is a temporary upload
        }
      })
    }

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

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Only teachers and admins can delete question files
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Unauthorized - only teachers and admins can delete question files' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')
    const examId = searchParams.get('examId')

    if (!questionId || !examId) {
      return NextResponse.json({ error: 'Missing question ID or exam ID' }, { status: 400 })
    }

    // Get question info
    const { data: questionData, error: questionError } = await supabase
      .from('exam_questions')
      .select('file_path, exam_id, exams(created_by, school_id)')
      .eq('id', questionId)
      .eq('exam_id', examId)
      .single()

    if (questionError || !questionData) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check permissions
    const exam = questionData.exams as any
    const isExamCreator = exam.created_by === user.id
    const isAdmin = profile.role === 'admin' && profile.school_id === exam.school_id

    if (!isExamCreator && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to delete files for this exam' }, { status: 403 })
    }

    // Delete file from Wasabi if it exists
    if (questionData.file_path) {
      try {
        const { deleteFileFromWasabi } = await import('@/lib/wasabi')
        await deleteFileFromWasabi(questionData.file_path)
      } catch (error) {
        console.error('Wasabi delete error:', error)
        // Continue with database cleanup even if Wasabi delete fails
      }
    }

    // Clear file info from database
    const { error: updateError } = await supabase
      .from('exam_questions')
      .update({
        question_text: '',
        file_path: null,
        file_name: null,
        file_size: null,
        mime_type: null
      })
      .eq('id', questionId)
      .eq('exam_id', examId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to remove file info from database' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

