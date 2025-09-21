import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/setup-invitation-table - Create the school_invitations table
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Create school_invitations table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS school_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        invitation_code TEXT UNIQUE NOT NULL,
        invited_by UUID REFERENCES profiles(id) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
        accepted_at TIMESTAMP WITH TIME ZONE,
        accepted_by UUID REFERENCES profiles(id),
        message TEXT
      );
    `

    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      // Try alternative approach - direct SQL execution
      const { data: altData, error: altError } = await supabase
        .from('school_invitations')
        .select('id')
        .limit(1)

      if (altError && altError.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          error: 'Table creation failed',
          details: 'The school_invitations table does not exist and could not be created automatically. Please run the database migration manually.',
          migrationNeeded: true,
          sqlToRun: createTableSQL
        })
      }
    }

    // Test if table now exists
    const { data: testData, error: testError } = await supabase
      .from('school_invitations')
      .select('id')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Table still does not exist after creation attempt',
        details: testError.message,
        migrationNeeded: true,
        sqlToRun: createTableSQL
      })
    }

    return NextResponse.json({
      success: true,
      message: 'school_invitations table created successfully',
      tableExists: true
    })

  } catch (error) {
    console.error('Error setting up invitation table:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      migrationNeeded: true
    }, { status: 500 })
  }
}

// GET /api/setup-invitation-table - Check table status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Test if school_invitations table exists
    const { data, error } = await supabase
      .from('school_invitations')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        tableExists: false,
        error: error.message,
        code: error.code,
        migrationNeeded: true
      })
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      message: 'school_invitations table exists and is accessible'
    })

  } catch (error) {
    console.error('Error checking invitation table:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      migrationNeeded: true
    }, { status: 500 })
  }
}

