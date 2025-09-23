import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, description } = body

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

    console.log('Test course creation with profile:', profile)

    // Try to create a test course
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        title: title || 'Test Course',
        description: description || 'Test course created via API',
        school_id: profile.school_id,
        created_by: profile.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Course creation error:', createError)
      return NextResponse.json({ 
        error: 'Failed to create course',
        details: createError,
        profile: profile
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      course,
      profile
    })
  } catch (error) {
    console.error('Error in test course creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
