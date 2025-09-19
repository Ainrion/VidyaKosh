import { NextRequest, NextResponse } from 'next/server'
import { testEmailConfiguration, sendEmail } from '@/lib/email'

// GET /api/test-email - Test email configuration
export async function GET(request: NextRequest) {
  try {
    const config = await testEmailConfiguration()
    
    return NextResponse.json({
      success: true,
      configuration: config,
      message: config.message
    })
  } catch (error) {
    console.error('Error testing email configuration:', error)
    return NextResponse.json({ 
      error: 'Failed to test email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/test-email - Send test email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject = 'Test Email from Vidyakosh', message = 'This is a test email to verify your email configuration.' } = body

    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    const emailSent = await sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🎓 Vidyakosh Email Test</h2>
          <p>Hello!</p>
          <p>${message}</p>
          <p>If you received this email, your email configuration is working correctly!</p>
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

${message}

If you received this email, your email configuration is working correctly!

This is a test email from Vidyakosh LMS.
Sent at: ${new Date().toISOString()}
      `
    })

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        recipient: to
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        message: 'Please check your email configuration'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

