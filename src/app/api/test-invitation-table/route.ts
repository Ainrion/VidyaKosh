import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/test-invitation-table - Test if school_invitations table exists
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Test if school_invitations table exists by trying to query it
    const { data, error } = await supabase
      .from('school_invitations')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        tableExists: false
      })
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      message: 'school_invitations table exists and is accessible',
      sampleData: data
    })

  } catch (error) {
    console.error('Error testing invitation table:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      tableExists: false
    }, { status: 500 })
  }
}

// POST /api/test-invitation-table - Test invitation creation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email = 'test@example.com' } = body

    // Test invitation creation step by step
    const testResults = {
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

    // Step 3: Try to create invitation (without auth for testing)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invitation, error: createError } = await supabase
      .from('school_invitations')
      .insert({
        school_id: '00000000-0000-0000-0000-000000000000', // Test school ID
        email: email.toLowerCase().trim(),
        invitation_code: invitationCode,
        invited_by: '00000000-0000-0000-0000-000000000000', // Test user ID
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
    console.error('Error in test invitation creation:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

