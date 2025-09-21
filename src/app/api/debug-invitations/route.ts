import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/debug-invitations - Debug invitation system
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if school_invitations table exists and get basic info
    const { data: invitations, error: invitationsError } = await supabase
      .from('school_invitations')
      .select('*')
      .limit(5)

    // Check if profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, school_id')
      .limit(5)

    // Check if schools table exists
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(5)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: profile.role,
        school_id: profile.school_id,
        full_name: profile.full_name
      },
      tables: {
        school_invitations: {
          exists: !invitationsError,
          error: invitationsError?.message,
          count: invitations?.length || 0,
          sample: invitations || []
        },
        profiles: {
          exists: !profilesError,
          error: profilesError?.message,
          count: profiles?.length || 0,
          sample: profiles || []
        },
        schools: {
          exists: !schoolsError,
          error: schoolsError?.message,
          count: schools?.length || 0,
          sample: schools || []
        }
      },
      debug: {
        invitationsError: invitationsError,
        profilesError: profilesError,
        schoolsError: schoolsError
      }
    })
  } catch (error) {
    console.error('Error in debug-invitations GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/debug-invitations - Test invitation creation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email = 'test@example.com' } = body

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Test invitation creation step by step
    const testResults: any = {
      user: {
        id: user.id,
        role: profile.role,
        school_id: profile.school_id,
        full_name: profile.full_name
      },
      steps: {}
    }

    // Step 1: Generate invitation code
    const generateInvitationCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const invitationCode = generateInvitationCode()
    testResults.steps.codeGeneration = {
      success: true,
      code: invitationCode
    }

    // Step 2: Check if code is unique
    const { data: existingCode, error: codeCheckError } = await supabase
      .from('school_invitations')
      .select('id')
      .eq('invitation_code', invitationCode)
      .single()

    testResults.steps.codeUniqueness = {
      success: !codeCheckError || codeCheckError.code === 'PGRST116',
      isUnique: !existingCode,
      error: codeCheckError?.message
    }

    // Step 3: Try to create invitation
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invitation, error: createError } = await supabase
      .from('school_invitations')
      .insert({
        school_id: profile.school_id,
        email: email.toLowerCase().trim(),
        invitation_code: invitationCode,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        message: 'Test invitation',
        status: 'pending'
      })
      .select('*')
      .single()

    testResults.steps.invitationCreation = {
      success: !createError,
      invitation: invitation,
      error: createError?.message,
      details: createError
    }

    // Step 4: Clean up test invitation
    if (invitation && !createError) {
      await supabase
        .from('school_invitations')
        .delete()
        .eq('id', invitation.id)
      
      testResults.steps.cleanup = {
        success: true,
        message: 'Test invitation cleaned up'
      }
    }

    return NextResponse.json({
      success: true,
      testResults: testResults,
      overallSuccess: testResults.steps.codeGeneration.success && 
                     testResults.steps.codeUniqueness.success && 
                     testResults.steps.invitationCreation.success
    })

  } catch (error) {
    console.error('Error in debug-invitations POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

