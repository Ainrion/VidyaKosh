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
    const courseId = formData.get('courseId') as string

    if (!file || !courseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
    }

    // Validate file size (25MB limit for assignments)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large (max 25MB)' }, { status: 400 })
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

    const isCourseCreator = courseData.created_by === user.id
    const isAdmin = profile.role === 'admin' && profile.school_id === courseData.school_id

    if (!isCourseCreator && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to upload files for this course' }, { status: 403 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${user.id}/${courseId}/${timestamp}-${file.name}`
    const filePath = `assignments/${fileName}`

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assignment-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('assignment-files')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
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
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json({ error: 'Missing file path' }, { status: 400 })
    }

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('assignment-files')
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
