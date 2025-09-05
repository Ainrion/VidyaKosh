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
    const { 
      title, 
      description, 
      school_id, 
      created_by, 
      start_date, 
      end_date, 
      all_day = false,
      location,
      event_type = 'other',
      color = '#3b82f6',
      is_public = true
    } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ 
        error: 'Title is required' 
      }, { status: 400 })
    }

    if (!school_id) {
      return NextResponse.json({ 
        error: 'School ID is required' 
      }, { status: 400 })
    }

    if (!created_by) {
      return NextResponse.json({ 
        error: 'Created by user ID is required' 
      }, { status: 400 })
    }

    if (!start_date) {
      return NextResponse.json({ 
        error: 'Start date is required' 
      }, { status: 400 })
    }

    // Create calendar event using service role (bypasses RLS)
    const { data: event, error: createError } = await supabase
      .from('calendar_events')
      .insert({
        school_id,
        title: title.trim(),
        description: description || null,
        event_type,
        start_date,
        end_date: end_date || null,
        all_day,
        location: location || null,
        color,
        is_public,
        created_by
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
      message: 'Calendar event created successfully'
    })
  } catch (error) {
    console.error('Error in calendar create:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
