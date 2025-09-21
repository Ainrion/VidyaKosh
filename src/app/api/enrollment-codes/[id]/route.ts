import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/enrollment-codes/[id] - Update enrollment code
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, description, isActive, expiresInDays, maxUses } = body
    const { id: codeId } = await params

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

    // Get the enrollment code to check permissions
    const { data: existingCode, error: codeError } = await supabase
      .from('course_enrollment_codes')
      .select(`
        *,
        course:courses(id, title, school_id, created_by)
      `)
      .eq('id', codeId)
      .single()

    if (codeError || !existingCode) {
      return NextResponse.json({ error: 'Enrollment code not found' }, { status: 404 })
    }

    // Check permissions
    if (profile.role === 'teacher' && existingCode.course.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only update codes for your own courses' }, { status: 403 })
    } else if (profile.role === 'admin' && existingCode.course.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only update codes for courses in your school' }, { status: 403 })
    } else if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.is_active = isActive
    if (maxUses !== undefined) updateData.max_uses = maxUses

    // Handle expiration date
    if (expiresInDays !== undefined) {
      if (expiresInDays === null || expiresInDays === 0) {
        updateData.expires_at = null
      } else {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)
        updateData.expires_at = expiresAt.toISOString()
      }
    }

    // Update enrollment code
    const { data: code, error: updateError } = await supabase
      .from('course_enrollment_codes')
      .update(updateData)
      .eq('id', codeId)
      .select(`
        *,
        course:courses(title, description),
        created_by_profile:profiles!course_enrollment_codes_created_by_fkey(full_name, email)
      `)
      .single()

    if (updateError) {
      console.error('Error updating enrollment code:', updateError)
      return NextResponse.json({ error: 'Failed to update enrollment code' }, { status: 500 })
    }

    return NextResponse.json({ 
      code, 
      message: 'Enrollment code updated successfully' 
    })
  } catch (error) {
    console.error('Error in enrollment code PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/enrollment-codes/[id] - Delete enrollment code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: codeId } = await params

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

    // Get the enrollment code to check permissions
    const { data: existingCode, error: codeError } = await supabase
      .from('course_enrollment_codes')
      .select(`
        *,
        course:courses(id, title, school_id, created_by)
      `)
      .eq('id', codeId)
      .single()

    if (codeError || !existingCode) {
      return NextResponse.json({ error: 'Enrollment code not found' }, { status: 404 })
    }

    // Check permissions
    if (profile.role === 'teacher' && existingCode.course.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only delete codes for your own courses' }, { status: 403 })
    } else if (profile.role === 'admin' && existingCode.course.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only delete codes for courses in your school' }, { status: 403 })
    } else if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete enrollment code
    const { error: deleteError } = await supabase
      .from('course_enrollment_codes')
      .delete()
      .eq('id', codeId)

    if (deleteError) {
      console.error('Error deleting enrollment code:', deleteError)
      return NextResponse.json({ error: 'Failed to delete enrollment code' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Enrollment code deleted successfully' 
    })
  } catch (error) {
    console.error('Error in enrollment code DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


