import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // Only admins can list all schools
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false })

    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError)
      return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
    }

    return NextResponse.json({ schools })
  } catch (error) {
    console.error('Error in GET /api/schools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Only admins can create schools
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create schools' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, email, logo_url } = body

    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    // Create the school
    const { data: school, error: createError } = await supabase
      .from('schools')
      .insert({
        name,
        address,
        phone,
        email,
        logo_url
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating school:', createError)
      return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
    }

    return NextResponse.json({ school })
  } catch (error) {
    console.error('Error in POST /api/schools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
