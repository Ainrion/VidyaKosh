import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get user profile to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get the school with user count
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select(`
        *,
        profiles(count)
      `)
      .eq('id', id)
      .single()

    if (schoolError) {
      console.error('Error fetching school:', schoolError)
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    return NextResponse.json({ school })
  } catch (error) {
    console.error('Error in GET /api/schools/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get user profile to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only admins can update schools
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update schools' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, email, logo_url } = body

    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    // Update the school
    const { data: school, error: updateError } = await supabase
      .from('schools')
      .update({
        name,
        address,
        phone,
        email,
        logo_url
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating school:', updateError)
      return NextResponse.json({ error: 'Failed to update school' }, { status: 500 })
    }

    return NextResponse.json({ school })
  } catch (error) {
    console.error('Error in PUT /api/schools/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Get user profile to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only admins can delete schools
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete schools' }, { status: 403 })
    }

    // Check if school has users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('school_id', id)
      .limit(1)

    if (usersError) {
      console.error('Error checking school users:', usersError)
      return NextResponse.json({ error: 'Failed to check school users' }, { status: 500 })
    }

    if (users && users.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete school with existing users. Please reassign or remove all users first.' 
      }, { status: 400 })
    }

    // Delete the school
    const { error: deleteError } = await supabase
      .from('schools')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting school:', deleteError)
      return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/schools/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
