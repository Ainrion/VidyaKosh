// Test email configuration
// Run with: node test-email-setup.js

import { testEmailConfiguration, sendEmail } from './src/lib/email.js'

async function testEmailSetup() {
  console.log('🧪 Testing Email Configuration...\n')
  
  // Check which providers are configured
  const config = await testEmailConfiguration()
  console.log('📧 Email Provider Status:')
  console.log(`   Resend: ${config.resend ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`   SendGrid: ${config.sendgrid ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`   SMTP: ${config.smtp ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`   Message: ${config.message}\n`)
  
  if (!config.resend && !config.sendgrid && !config.smtp) {
    console.log('❌ No email providers configured!')
    console.log('Please set up at least one email provider in your .env.local file.')
    console.log('See EMAIL_PROVIDER_SETUP.md for instructions.')
    return
  }
  
  // Test sending an email
  console.log('📤 Testing email sending...')
  
  const testEmail = process.argv[2] || 'test@example.com'
  console.log(`   Sending test email to: ${testEmail}`)
  
  const success = await sendEmail({
    to: testEmail,
    subject: '🎓 Vidyakosh Email Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">🎓 Vidyakosh Email Test</h1>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Email Provider Status:</h3>
          <ul>
            <li>Resend: ${config.resend ? '✅' : '❌'}</li>
            <li>SendGrid: ${config.sendgrid ? '✅' : '❌'}</li>
            <li>SMTP: ${config.smtp ? '✅' : '❌'}</li>
          </ul>
        </div>
        <p>If you received this email, your email configuration is working! 🎉</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated test email from Vidyakosh LMS.
        </p>
      </div>
    `,
    text: `
🎓 Vidyakosh Email Test

This is a test email to verify your email configuration is working correctly.

Email Provider Status:
- Resend: ${config.resend ? '✅' : '❌'}
- SendGrid: ${config.sendgrid ? '✅' : '❌'}
- SMTP: ${config.smtp ? '✅' : '❌'}

If you received this email, your email configuration is working! 🎉

This is an automated test email from Vidyakosh LMS.
    `
  })
  
  if (success) {
    console.log('✅ Email sent successfully!')
    console.log('Check your inbox (and spam folder) for the test email.')
  } else {
    console.log('❌ Failed to send email.')
    console.log('Check your email provider configuration and try again.')
  }
}

// Run the test
testEmailSetup().catch(console.error)

