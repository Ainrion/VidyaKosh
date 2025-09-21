import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/invitations/[id] - Update invitation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { status, message } = body
    const { id: invitationId } = await params

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

    // Only admins can update invitations
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = { status }
    if (message !== undefined) updateData.message = message

    // Update invitation
    const { data: invitation, error: updateError } = await supabase
      .from('school_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .eq('school_id', profile.school_id) // Ensure admin can only update their school's invitations
      .select(`
        *,
        invited_by_profile:profiles!school_invitations_invited_by_fkey(full_name, email),
        school:schools(name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 })
    }

    return NextResponse.json({ 
      invitation, 
      message: `Invitation ${status} successfully` 
    })
  } catch (error) {
    console.error('Error in invitation PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/invitations/[id] - Cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: invitationId } = await params

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

    // Only admins can delete invitations
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('school_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('school_id', profile.school_id) // Ensure admin can only delete their school's invitations

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Invitation cancelled successfully' 
    })
  } catch (error) {
    console.error('Error in invitation DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


