import { NextRequest, NextResponse } from 'next/server'

// POST /api/test-resend-detailed - Test Resend with detailed error reporting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to = 'test@example.com' } = body

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not found in environment variables'
      }, { status: 500 })
    }

    console.log('Testing Resend with API key:', resendApiKey.substring(0, 10) + '...')
    console.log('Sending to:', to)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vidyakosh <onboarding@resend.dev>',
        to: [to],
        subject: 'Vidyakosh Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">🎓 Vidyakosh Email Test</h2>
            <p>Hello!</p>
            <p>This is a test email to verify your Resend configuration is working correctly!</p>
            <p>If you received this email, your email configuration is working perfectly!</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is a test email from Vidyakosh LMS.<br>
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
        `,
        text: `
🎓 Vidyakosh Email Test

Hello!

This is a test email to verify your Resend configuration is working correctly!

If you received this email, your email configuration is working perfectly!

This is a test email from Vidyakosh LMS.
Sent at: ${new Date().toISOString()}
        `
      }),
    })

    const responseText = await response.text()
    console.log('Resend API response status:', response.status)
    console.log('Resend API response:', responseText)

    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Resend API error',
        status: response.status,
        details: errorData,
        apiKeyPrefix: resendApiKey.substring(0, 10) + '...'
      }, { status: 500 })
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { message: responseText }
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully with Resend',
      result: result,
      apiKeyPrefix: resendApiKey.substring(0, 10) + '...'
    })

  } catch (error) {
    console.error('Error in detailed Resend test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
