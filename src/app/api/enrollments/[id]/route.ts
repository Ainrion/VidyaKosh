import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/enrollments/[id] - Update enrollment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { status, notes, approvedBy } = body
    const { id: enrollmentId } = await params

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
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

    // Only admins and teachers can update enrollments
    if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the enrollment to check permissions
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(id, title, school_id, created_by)
      `)
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check permissions
    if (profile.role === 'teacher' && enrollment.course.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only update enrollments for your own courses' }, { status: 403 })
    } else if (profile.role === 'admin' && enrollment.course.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only update enrollments for courses in your school' }, { status: 403 })
    }

    // Prepare update data - start with basic fields
    const updateData: any = { status }
    if (notes !== undefined) updateData.notes = notes

    // Try to add optional fields if they exist
    try {
      if (approvedBy !== undefined) updateData.approved_by = approvedBy
      if (status === 'active' && !approvedBy) {
        updateData.approved_by = user.id
        updateData.approved_at = new Date().toISOString()
      }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }
    } catch (e) {
      console.log('Optional columns not available, using basic update')
    }

    // Update enrollment with simplified select
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollmentId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating enrollment:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update enrollment',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      enrollment: updatedEnrollment, 
      message: `Enrollment ${status} successfully` 
    })
  } catch (error) {
    console.error('Error in enrollment PATCH:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/enrollments/[id] - Delete enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: enrollmentId } = await params

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

    // Only admins and teachers can delete enrollments
    if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the enrollment to check permissions
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(id, title, school_id, created_by)
      `)
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check permissions
    if (profile.role === 'teacher' && enrollment.course.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only delete enrollments for your own courses' }, { status: 403 })
    } else if (profile.role === 'admin' && enrollment.course.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only delete enrollments for courses in your school' }, { status: 403 })
    }

    // Delete enrollment
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId)

    if (deleteError) {
      console.error('Error deleting enrollment:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete enrollment',
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Enrollment deleted successfully' 
    })
  } catch (error) {
    console.error('Error in enrollment DELETE:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}