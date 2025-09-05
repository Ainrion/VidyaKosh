import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      environment: envCheck
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Test API failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
