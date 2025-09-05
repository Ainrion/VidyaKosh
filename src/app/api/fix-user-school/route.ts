import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Service role key not configured' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch profile' 
      }, { status: 500 })
    }

    // If profile has school_id, return it
    if (profile.school_id) {
      return NextResponse.json({ 
        success: true,
        profile,
        message: 'Profile already has school assignment'
      })
    }

    // Get first available school
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)

    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError)
      return NextResponse.json({ 
        error: 'Failed to fetch schools' 
      }, { status: 500 })
    }

    if (!schools || schools.length === 0) {
      // Create a default school
      const { data: newSchool, error: createSchoolError } = await supabase
        .from('schools')
        .insert({
          name: 'Default School',
          address: 'Default Address',
          phone: 'Default Phone',
          email: 'default@school.com'
        })
        .select()
        .single()

      if (createSchoolError) {
        console.error('Error creating default school:', createSchoolError)
        return NextResponse.json({ 
          error: 'Failed to create default school' 
        }, { status: 500 })
      }

      // Update profile with new school
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ school_id: newSchool.id })
        .eq('id', user_id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update profile' 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true,
        profile: updatedProfile,
        school: newSchool,
        message: 'Created default school and assigned to user'
      })
    }

    // Update profile with first school
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ school_id: schools[0].id })
      .eq('id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      profile: updatedProfile,
      school: schools[0],
      message: 'Assigned user to existing school'
    })
  } catch (error) {
    console.error('Error in fix-user-school:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
