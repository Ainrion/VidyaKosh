import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 })
    }

    // Validate invitation code
    const { data: invitation, error } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(*),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
      `)
      .eq('invitation_code', code)
      .eq('status', 'pending')
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation code' }, { status: 404 })
    }

    // Check if invitation is expired
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ error: 'Invitation code has expired' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        school_id: invitation.school_id,
        expires_at: invitation.expires_at,
        school: {
          id: invitation.school?.id,
          name: invitation.school?.name || 'Unknown School'
        },
        invited_by_profile: {
          full_name: invitation.invited_by_profile?.full_name || 'Unknown'
        }
      }
    })
  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}