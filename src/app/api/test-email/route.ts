import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, testEmailConfiguration } from '@/lib/email'

export async function GET() {
  try {
    const config = await testEmailConfiguration()
    
    return NextResponse.json({
      success: true,
      configuration: config,
      environment: {
        SMTP_HOST: !!process.env.SMTP_HOST,
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASS: !!process.env.SMTP_PASS,
        SMTP_PORT: process.env.SMTP_PORT || '587',
        SMTP_FROM: process.env.SMTP_FROM,
        SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
      }
    })
  } catch (error) {
    console.error('Error testing email configuration:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, message } = body

    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log('🧪 Testing email sending to:', to)

    const success = await sendEmail({
      to,
      subject: subject || 'Test Email from Riven',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🧪 Test Email</h2>
          <p>This is a test email from your Riven LMS system.</p>
          <p><strong>Message:</strong> ${message || 'No message provided'}</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, your email configuration is working correctly!
          </p>
        </div>
      `,
      text: `Test Email from Vidyakosh\n\nMessage: ${message || 'No message provided'}\n\nSent at: ${new Date().toISOString()}\n\nIf you received this email, your email configuration is working correctly!`
    })

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully!' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send test email. Check your email configuration.' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}