import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    // Only admins can assign users to schools
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can assign users to schools' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, schoolId } = body

    if (!userId || !schoolId) {
      return NextResponse.json({ error: 'User ID and School ID are required' }, { status: 400 })
    }

    // Verify the school exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Update the user's school assignment
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ school_id: schoolId })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user school:', updateError)
      return NextResponse.json({ error: 'Failed to assign user to school' }, { status: 500 })
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Error in POST /api/users/assign-school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
