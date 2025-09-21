#!/usr/bin/env node

/**
 * Test script for Nodemailer email functionality
 * This script tests the SMTP configuration and email sending
 */

import nodemailer from 'nodemailer';

async function testNodemailer() {
  console.log('🧪 Testing Nodemailer SMTP configuration...\n');

  // Check environment variables
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT || '587'
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  console.log('📋 Configuration Check:');
  console.log(`SMTP Host: ${smtpHost || '❌ Not set'}`)
  console.log(`SMTP Port: ${smtpPort || '❌ Not set'}`)
  console.log(`SMTP User: ${smtpUser || '❌ Not set'}`)
  console.log(`SMTP Pass: ${smtpPass ? '✅ Set' : '❌ Not set'}`)
  console.log(`SMTP From: ${smtpFrom || '❌ Not set'}`)
  console.log('')

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('❌ Missing required SMTP configuration!')
    console.log('Please set the following environment variables:')
    console.log('- SMTP_HOST (e.g., smtp.gmail.com)')
    console.log('- SMTP_USER (your email address)')
    console.log('- SMTP_PASS (your app password)')
    console.log('- SMTP_PORT (optional, defaults to 587)')
    console.log('- SMTP_FROM (optional, defaults to SMTP_USER)')
    return
  }

  try {
    console.log('🔧 Creating SMTP transporter...')
    
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      }
    })

    console.log('✅ Transporter created successfully')

    // Test 1: Verify connection
    console.log('\n🔍 Testing SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP server connection verified successfully')

    // Test 2: Send test email (if recipient provided)
    const testRecipient = process.argv[2] // Get recipient from command line
    if (testRecipient) {
      console.log(`\n📧 Sending test email to: ${testRecipient}`)
      
      const testEmail = {
        from: smtpFrom,
        to: testRecipient,
        subject: '⚡ Riven - Nodemailer Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">⚡ Riven - Nodemailer Test Successful!</h2>
            <p>This is a test email sent using Nodemailer with SMTP for the Riven learning platform.</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${smtpHost}</li>
                <li><strong>SMTP Port:</strong> ${smtpPort}</li>
                <li><strong>From:</strong> ${smtpFrom}</li>
                <li><strong>Sent At:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>If you received this email, your Nodemailer setup is working correctly! 🚀</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This email was sent from <strong>⚡ Riven</strong> using Nodemailer.
            </p>
          </div>
        `,
        text: `
⚡ Riven - Nodemailer Test Successful!

This is a test email sent using Nodemailer with SMTP for the Riven learning platform.

Configuration Details:
- SMTP Host: ${smtpHost}
- SMTP Port: ${smtpPort}
- From: ${smtpFrom}
- Sent At: ${new Date().toLocaleString()}

If you received this email, your Nodemailer setup is working correctly! 🚀

This email was sent from ⚡ Riven using Nodemailer.
        `
      }

      const info = await transporter.sendMail(testEmail)
      console.log('✅ Test email sent successfully!')
      console.log(`Message ID: ${info.messageId}`)
      console.log(`Accepted: ${info.accepted.join(', ')}`)
      if (info.rejected.length > 0) {
        console.log(`Rejected: ${info.rejected.join(', ')}`)
      }
    } else {
      console.log('\n💡 To send a test email, run:')
      console.log(`node test-nodemailer.js your-email@example.com`)
    }

    console.log('\n🎉 All tests passed! Nodemailer is ready to use.')
    console.log('\n📋 Next steps:')
    console.log('1. Your SMTP configuration is working')
    console.log('2. Restart your development server')
    console.log('3. Test invitation emails from the admin dashboard')
    console.log('4. Check that emails are being sent successfully')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error Solutions:')
      console.log('- Use app passwords, not your regular password')
      console.log('- Enable 2-factor authentication first')
      console.log('- Check if SMTP is enabled for your email provider')
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Error Solutions:')
      console.log('- Check your internet connection')
      console.log('- Verify SMTP host and port are correct')
      console.log('- Try different port (587 vs 465)')
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔧 Timeout Error Solutions:')
      console.log('- Check firewall settings')
      console.log('- Try different SMTP server')
      console.log('- Check if your ISP blocks SMTP ports')
    }
    
    console.log('\n📖 For more help, see NODEMAILER_SETUP_GUIDE.md')
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testNodemailer();
}

export { testNodemailer };
