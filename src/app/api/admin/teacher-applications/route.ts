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

    // Fetch teacher applications for the admin's school
    const { data: applications, error: applicationsError } = await supabase
      .from('teacher_applications')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    if (applicationsError) {
      console.error('Error fetching teacher applications:', applicationsError)
      return NextResponse.json({ 
        error: 'Failed to fetch teacher applications' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      applications: applications || []
    })

  } catch (error) {
    console.error('Error in teacher applications API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
