import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: userError.message 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Check table status
    const { data: tableStatus, error: tableError } = await supabase
      .rpc('check_messaging_tables')

    // Get user school info
    const { data: userInfo, error: userInfoError } = await supabase
      .rpc('get_user_school_info')

    // Get profile info directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Try to get existing channels if table exists
    let channels = null
    let channelsError = null
    
    if (tableStatus?.channels_exists && profile?.school_id) {
      const { data: channelsData, error: chError } = await supabase
        .from('channels')
        .select('*')
        .eq('school_id', profile.school_id)
      
      channels = channelsData
      channelsError = chError
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        user: {
          id: user.id,
          email: user.email
        },
        table_status: tableStatus || { error: tableError?.message },
        user_info: userInfo || { error: userInfoError?.message },
        profile: profile || { error: profileError?.message },
        channels: {
          data: channels,
          error: channelsError?.message
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Debug messaging error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}
