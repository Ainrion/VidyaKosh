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

    // Check if calendar_events table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('calendar_events')
      .select('count')
      .limit(1)

    if (tableError) {
      return NextResponse.json({ 
        error: 'Table check failed',
        details: tableError
      }, { status: 500 })
    }

    // Get all calendar events
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      return NextResponse.json({ 
        error: 'Failed to fetch events',
        details: eventsError
      }, { status: 500 })
    }

    // Get all schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (schoolsError) {
      return NextResponse.json({ 
        error: 'Failed to fetch schools',
        details: schoolsError
      }, { status: 500 })
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (profilesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch profiles',
        details: profilesError
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      tableExists: !!tableExists,
      events: events || [],
      schools: schools || [],
      profiles: profiles || [],
      counts: {
        events: events?.length || 0,
        schools: schools?.length || 0,
        profiles: profiles?.length || 0
      }
    })
  } catch (error) {
    console.error('Error in test-calendar:', error)
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
    const { title, description, school_id, created_by, start_date, end_date } = body

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
        error: 'No school or profile available for event creation' 
      }, { status: 400 })
    }

    // Create test calendar event
    const { data: event, error: createError } = await supabase
      .from('calendar_events')
      .insert({
        title: title || 'Test Calendar Event',
        description: description || 'This is a test calendar event created via API',
        school_id: schoolId,
        created_by: createdById,
        event_type: 'other',
        start_date: start_date || new Date().toISOString(),
        end_date: end_date || new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        all_day: false,
        color: '#3b82f6',
        is_public: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating calendar event:', createError)
      return NextResponse.json({ 
        error: 'Failed to create calendar event',
        details: createError
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      event,
      message: 'Test calendar event created successfully'
    })
  } catch (error) {
    console.error('Error in test-calendar POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
