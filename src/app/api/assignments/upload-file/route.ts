import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  uploadFileToWasabi, 
  generateAssignmentFilePath, 
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string
    const assignmentId = formData.get('assignmentId') as string

    if (!file || !courseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file using the enhanced validation function
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if user has permission to upload for this course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, created_by, school_id')
      .eq('id', courseId)
      .single()

    if (courseError || !courseData) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user is the course creator or an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Multi-tenant isolation: ensure user belongs to the same school as the course
    if (profile.school_id !== courseData.school_id) {
      return NextResponse.json({ error: 'Unauthorized: Course belongs to a different school' }, { status: 403 })
    }

    const isCourseCreator = courseData.created_by === user.id
    const isAdmin = profile.role === 'admin' && profile.school_id === courseData.school_id

    if (!isCourseCreator && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to upload files for this course' }, { status: 403 })
    }

    // Generate unique file path with school-based multi-tenant organization
    const filePath = generateAssignmentFilePath(user.id, courseId, assignmentId || 'general', file.name, courseData.school_id)

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload file to Wasabi with metadata including school isolation
    const uploadResult = await uploadFileToWasabi(fileBuffer, filePath, file.type, {
      'user-id': user.id,
      'school-id': courseData.school_id,
      'course-id': courseId,
      'assignment-id': assignmentId || 'general',
      'original-name': file.name,
      'upload-type': 'assignment'
    })

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: uploadResult.size,
        type: file.type,
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
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 })
    }

    // Delete file from Wasabi
    try {
      await deleteFileFromWasabi(filePath)
      console.log('Assignment file deleted successfully:', filePath)
    } catch (deleteError) {
      console.error('Wasabi delete error:', deleteError)
      // Don't fail if file doesn't exist
      if (deleteError instanceof Error && deleteError.message?.includes('NoSuchKey')) {
        console.log('File not found in Wasabi, continuing with cleanup')
      } else {
        throw deleteError
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
