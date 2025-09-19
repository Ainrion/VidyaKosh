import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const examSessionId = formData.get('examSessionId') as string
    const questionId = formData.get('questionId') as string

    if (!file || !examSessionId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large' }, { status: 400 })
    }

    // Check if user has permission to upload for this exam session
    const { data: sessionData, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('student_id, exam_id')
      .eq('id', examSessionId)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Exam session not found' }, { status: 404 })
    }

    if (sessionData.student_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}/${examSessionId}/${questionId}.${fileExtension}`
    const filePath = `answers/${fileName}`

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exam-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('exam-files')
      .getPublicUrl(filePath)

    // Save file info to database
    const { data: answerData, error: answerError } = await supabase
      .from('exam_answers')
      .upsert({
        exam_session_id: examSessionId,
        question_id: questionId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      }, {
        onConflict: 'exam_session_id,question_id'
      })
      .select()
      .single()

    if (answerError) {
      console.error('Database error:', answerError)
      // Try to clean up uploaded file
      await supabase.storage.from('exam-files').remove([filePath])
      return NextResponse.json({ error: 'Failed to save file info' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: answerData.id,
        name: file.name,
        size: file.size,
        url: urlData.publicUrl,
        path: filePath
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

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('exam-files')
      .remove([answerData.file_path])

    if (deleteError) {
      console.error('Delete error:', deleteError)
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
