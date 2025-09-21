import { NextRequest, NextResponse } from 'next/server'

// GET /api/debug-env - Debug environment variables
export async function GET(request: NextRequest) {
  try {
    // Check environment variables (without exposing sensitive data)
    const envCheck = {
      // Check if RESEND_API_KEY exists (without showing the actual key)
      RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0,
      RESEND_API_KEY_PREFIX: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 3) : 'N/A',
      
      // Check other email-related env vars
      SENDGRID_API_KEY_EXISTS: !!process.env.SENDGRID_API_KEY,
      SMTP_HOST_EXISTS: !!process.env.SMTP_HOST,
      SMTP_USER_EXISTS: !!process.env.SMTP_USER,
      SMTP_PASS_EXISTS: !!process.env.SMTP_PASS,
      
      // Check site URL
      SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      
      // Check if we're in development
      NODE_ENV: process.env.NODE_ENV,
      
      // List all environment variables that start with RESEND
      RESEND_VARS: Object.keys(process.env).filter(key => key.startsWith('RESEND')),
      
      // List all environment variables that start with NEXT_PUBLIC
      NEXT_PUBLIC_VARS: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')),
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variables debug info'
    })

  } catch (error) {
    console.error('Error debugging environment:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
