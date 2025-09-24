import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  uploadFileToWasabi, 
  generateAssignmentSubmissionFilePath, 
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

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Only students can submit assignment files
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit assignment files' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const assignmentId = formData.get('assignmentId') as string

    if (!file || !courseId || !assignmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if user is enrolled in the course and verify school isolation
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        courses (
          school_id
        )
      `)
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 })
    }

    // Multi-tenant isolation: ensure student belongs to the same school as the course
    const courseSchoolId = enrollment.courses?.school_id
    if (!courseSchoolId || profile.school_id !== courseSchoolId) {
      return NextResponse.json({ error: 'Unauthorized: Course belongs to a different school' }, { status: 403 })
    }

    // Check if assignment exists and is active
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, due_date, is_published')
      .eq('id', assignmentId)
      .eq('course_id', courseId)
      .eq('is_published', true)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found or not published' }, { status: 404 })
    }

    // Check if assignment is still accepting submissions
    if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
      return NextResponse.json({ error: 'Assignment deadline has passed' }, { status: 400 })
    }

    // Check if there's an existing submission and delete it
    const { data: existingSubmission, error: existingError } = await supabase
      .from('assignment_submissions')
      .select('file_path')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (existingSubmission?.file_path) {
      try {
        await deleteFileFromWasabi(existingSubmission.file_path)
        console.log('Deleted existing submission file:', existingSubmission.file_path)
      } catch (deleteError) {
        console.warn('Failed to delete existing submission file:', deleteError)
        // Continue with upload even if deletion fails
      }
    }

    // Generate unique file path for submission with school isolation
    const filePath = generateAssignmentSubmissionFilePath(user.id, courseId, assignmentId, file.name, courseSchoolId)

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload file to Wasabi with metadata including school isolation
    const uploadResult = await uploadFileToWasabi(fileBuffer, filePath, file.type, {
      'user-id': user.id,
      'school-id': courseSchoolId,
      'course-id': courseId,
      'assignment-id': assignmentId,
      'original-name': file.name,
      'upload-type': 'assignment-submission',
      'student-id': user.id
    })

    // Save submission info to database
    const { data: submissionData, error: submissionError } = await supabase
      .from('assignment_submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id: user.id,
        file_path: uploadResult.key,
        file_name: file.name,
        file_size: uploadResult.size,
        mime_type: file.type,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'assignment_id,student_id'
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Database error:', submissionError)
      // Try to clean up uploaded file
      try {
        await deleteFileFromWasabi(uploadResult.key)
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      return NextResponse.json({ error: 'Failed to save submission info' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submissionData.id,
        file: {
          name: file.name,
          size: uploadResult.size,
          type: file.type,
          url: uploadResult.url,
          path: uploadResult.key,
          uploadedAt: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Submission upload error:', error)
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
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignment ID' }, { status: 400 })
    }

    // Get submission info
    const { data: submissionData, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('file_path')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (submissionError || !submissionData) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Delete file from Wasabi
    if (submissionData.file_path) {
      try {
        await deleteFileFromWasabi(submissionData.file_path)
        console.log('Deleted submission file:', submissionData.file_path)
      } catch (deleteError) {
        console.error('Wasabi delete error:', deleteError)
        // Continue with database cleanup even if Wasabi delete fails
      }
    }

    // Delete submission from database
    const { error: dbDeleteError } = await supabase
      .from('assignment_submissions')
      .delete()
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)

    if (dbDeleteError) {
      console.error('Database delete error:', dbDeleteError)
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Submission delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
