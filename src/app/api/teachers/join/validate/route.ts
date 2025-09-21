import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Join token is required' }, { status: 400 })
    }

    // Validate teacher join token
    const { data: joinData, error } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(*),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
      `)
      .eq('join_token', token)
      .eq('role', 'teacher')
      .eq('status', 'pending')
      .single()

    if (error || !joinData) {
      return NextResponse.json({ error: 'Invalid or expired join link' }, { status: 404 })
    }

    // Check if join link is expired
    const now = new Date()
    const expiresAt = new Date(joinData.expires_at)
    
    // Add some buffer time (5 minutes) to account for clock skew and processing time
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    const adjustedNow = new Date(now.getTime() + bufferTime)
    
    console.log('Teacher join token validation:', {
      token,
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      adjustedNow: adjustedNow.toISOString(),
      timeRemaining: expiresAt.getTime() - now.getTime(),
      isExpired: adjustedNow > expiresAt
    })
    
    if (adjustedNow > expiresAt) {
      return NextResponse.json({ error: 'Join link has expired' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      joinData: {
        id: joinData.id,
        email: joinData.email,
        join_token: joinData.join_token,
        message: joinData.message,
        school: {
          id: joinData.school?.id,
          name: joinData.school?.name || 'Unknown School',
          email: joinData.school?.email,
          address: joinData.school?.address,
          logo_url: joinData.school?.logo_url
        },
        invited_by_profile: {
          full_name: joinData.invited_by_profile?.full_name || 'School Administrator',
          email: joinData.invited_by_profile?.email
        }
      }
    })
  } catch (error) {
    console.error('Error validating teacher join token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

