import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user's profile to check if they're an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 })
    }

    // Fetch school information
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name, address, phone, email, school_code, created_at')
      .eq('id', profile.school_id)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ 
        error: 'School not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      school: school
    })

  } catch (error) {
    console.error('Error in schools info API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
