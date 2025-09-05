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

    // Fetch profile using service role (bypasses RLS)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found
        return NextResponse.json({ 
          exists: false,
          profile: null,
          message: 'Profile not found'
        })
      }
      
      console.error('Error fetching profile:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch profile',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      exists: true,
      profile,
      message: 'Profile fetched successfully'
    })
  } catch (error) {
    console.error('Error in profile fetch:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
