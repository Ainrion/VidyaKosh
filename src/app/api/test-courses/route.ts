import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for testing
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

    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        created_by_profile:profiles!courses_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: coursesError
      }, { status: 500 })
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Get all schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false })

    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError)
    }

    return NextResponse.json({ 
      success: true,
      courses: courses || [],
      profiles: profiles || [],
      schools: schools || [],
      counts: {
        courses: courses?.length || 0,
        profiles: profiles?.length || 0,
        schools: schools?.length || 0
      }
    })
  } catch (error) {
    console.error('Error in test-courses:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for testing
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
    const { title, description, school_id, created_by } = body

    // Get first school if not provided
    let schoolId = school_id
    if (!schoolId) {
      const { data: schools } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
      
      if (schools && schools.length > 0) {
        schoolId = schools[0].id
      }
    }

    // Get first profile if not provided
    let createdById = created_by
    if (!createdById) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (profiles && profiles.length > 0) {
        createdById = profiles[0].id
      }
    }

    if (!schoolId || !createdById) {
      return NextResponse.json({ 
        error: 'No school or profile available for course creation' 
      }, { status: 400 })
    }

    // Create test course
    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        title: title || 'Test Course',
        description: description || 'This is a test course created via API',
        school_id: schoolId,
        created_by: createdById,
        archived: false
      })
      .select(`
        *,
        created_by_profile:profiles!courses_created_by_fkey(full_name)
      `)
      .single()

    if (createError) {
      console.error('Error creating course:', createError)
      return NextResponse.json({ 
        error: 'Failed to create course',
        details: createError
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      course,
      message: 'Test course created successfully'
    })
  } catch (error) {
    console.error('Error in test-courses POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
