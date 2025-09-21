// Email service for Riven LMS
// Supports Nodemailer (SMTP) as primary provider with SendGrid fallback

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

interface InvitationEmailData {
  recipientName: string
  recipientEmail: string
  schoolName: string
  inviterName: string
  invitationCode: string
  invitationUrl: string
  message?: string
  expiresAt: string
  // Teacher-specific fields
  role?: 'student' | 'teacher'
  joinUrl?: string
  joinToken?: string
}

// Email template for school invitations
export function generateInvitationEmail(data: InvitationEmailData): { html: string; text: string } {
  const { recipientName, schoolName, inviterName, invitationUrl, message, expiresAt, role, joinUrl } = data
  
  // Check if this is a teacher invitation
  const isTeacherInvitation = role === 'teacher' && joinUrl;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>School Invitation - Riven</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        .container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
          letter-spacing: -1px;
        }
        .logo-emoji {
          font-size: 28px;
          margin-right: 8px;
        }
        .title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        .content {
          margin-bottom: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #374151;
          margin-bottom: 20px;
        }
        .invitation-box {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .invitation-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0ea5e9, #06b6d4);
        }
        .invitation-code {
          font-size: 24px;
          font-weight: 800;
          color: #0c4a6e;
          font-family: 'Monaco', 'Menlo', monospace;
          letter-spacing: 3px;
          background: white;
          padding: 12px 20px;
          border-radius: 8px;
          display: inline-block;
          margin: 10px 0;
          border: 2px solid #0ea5e9;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          margin: 24px 0;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }
        .footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
        .expiry {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin: 20px 0;
          font-size: 14px;
          position: relative;
        }
        .expiry::before {
          content: '⏰';
          font-size: 18px;
          margin-right: 8px;
        }
        .steps {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .steps h3 {
          color: #374151;
          margin-bottom: 16px;
          font-size: 18px;
        }
        .steps ol {
          margin: 0;
          padding-left: 20px;
        }
        .steps li {
          margin-bottom: 8px;
          color: #4b5563;
        }
        .brand-footer {
          text-align: center;
          margin-top: 32px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 12px;
        }
        .brand-name {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        .brand-tagline {
          color: #6b7280;
          font-size: 14px;
        }
        @media (max-width: 600px) {
          .container {
            padding: 24px;
            margin: 10px;
          }
          .title {
            font-size: 24px;
          }
          .invitation-code {
            font-size: 20px;
            letter-spacing: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="logo-emoji">⚡</span>Riven
          </div>
          <h1 class="title">You're Invited to Join ${schoolName} as a ${role === 'teacher' ? 'Teacher' : 'Student'}!</h1>
        </div>
        
        <div class="content">
          <p class="greeting">Hello ${recipientName || 'there'},</p>
          
          <p><strong>${inviterName}</strong> has invited you to join <strong>${schoolName}</strong> on Riven, the modern learning platform that connects students, teachers, and administrators.</p>
          
          ${message ? `<div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 8px;"><em>"${message}"</em></div>` : ''}
          
          ${isTeacherInvitation ? `
          <div class="invitation-box" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none;">
            <p style="font-weight: 600; margin-bottom: 16px; color: white;">🎓 Teacher Quick Access</p>
            <p style="color: white; font-size: 16px; margin: 0;">No code needed! Click the button below for instant access.</p>
          </div>
          ` : `
          <div class="invitation-box">
            <p style="font-weight: 600; margin-bottom: 16px; color: #374151;">Your Invitation Code:</p>
            <div class="invitation-code">${data.invitationCode}</div>
            <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">Use this code to create your account</p>
          </div>
          `}
          
          <div style="text-align: center;">
            <a href="${isTeacherInvitation ? joinUrl : invitationUrl}" class="cta-button">
              ${isTeacherInvitation ? '🎓 Join as Teacher - Quick Access' : 'Accept Invitation & Join School'}
            </a>
          </div>
          
          <div class="expiry">
            <strong>Important:</strong> This invitation expires on ${new Date(expiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <div class="steps">
            <h3>What's Next?</h3>
            ${isTeacherInvitation ? `
            <ol>
              <li>Click the "Join as Teacher" button above</li>
              <li>Complete your teacher profile setup</li>
              <li>Access your teacher dashboard and tools</li>
              <li>Start creating courses and managing your classes</li>
            </ol>
            ` : `
            <ol>
              <li>Click the "Accept Invitation" button above</li>
              <li>Create your account using the invitation code</li>
              <li>Start exploring your school's courses and resources</li>
              <li>Connect with your teachers and classmates</li>
            </ol>
            `}
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact your school administrator or reply to this email.</p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${inviterName} from ${schoolName}.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        
        <div class="brand-footer">
          <div class="brand-name">⚡ Riven</div>
          <div class="brand-tagline">Modern Learning Management System</div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
⚡ Riven - School Invitation

Hello ${recipientName || 'there'},

${inviterName} has invited you to join ${schoolName} as a ${role === 'teacher' ? 'teacher' : 'student'} on Riven, the modern learning platform that connects students, teachers, and administrators.

${message ? `Message: "${message}"` : ''}

${isTeacherInvitation ? `
🎓 Teacher Quick Access
No code needed! Click the link below for instant access.
` : `
Your Invitation Code: ${data.invitationCode}
`}

${isTeacherInvitation ? `Join as Teacher: ${joinUrl}` : `Accept your invitation: ${invitationUrl}`}

⏰ Important: This invitation expires on ${new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}

What's Next?
1. Click the invitation link above
2. Create your account using the invitation code
3. Start exploring your school's courses and resources
4. Connect with your teachers and classmates

If you have any questions, please contact your school administrator.

This invitation was sent by ${inviterName} from ${schoolName}.
If you didn't expect this invitation, you can safely ignore this email.

⚡ Riven - Modern Learning Management System
  `

  return { html, text }
}

// Resend functionality removed - using Nodemailer only

// Send email using SendGrid
export async function sendEmailWithSendGrid(options: EmailOptions): Promise<boolean> {
  try {
    const sendGridApiKey = process.env.SENDGRID_API_KEY
    if (!sendGridApiKey) {
      console.error('SENDGRID_API_KEY not found in environment variables')
      return false
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
          subject: options.subject,
        }],
        from: { email: options.from || 'noreply@riven.com', name: 'Riven' },
        content: [
          { type: 'text/plain', value: options.text || '' },
          { type: 'text/html', value: options.html },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('SendGrid API error:', errorData)
      return false
    }

    console.log('Email sent successfully with SendGrid')
    return true
  } catch (error) {
    console.error('Error sending email with SendGrid:', error)
    return false
  }
}

// Send email using Nodemailer (SMTP)
export async function sendEmailWithNodemailer(options: EmailOptions): Promise<boolean> {
  try {
    const nodemailer = await import('nodemailer')
    
    // Check for required SMTP environment variables
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT || '587'
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpFrom = process.env.SMTP_FROM || smtpUser

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP configuration missing. Required: SMTP_HOST, SMTP_USER, SMTP_PASS')
      return false
    }

    console.log('Configuring Nodemailer with SMTP settings...', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      from: smtpFrom
    })

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      }
    })

    // Verify connection configuration
    try {
      await transporter.verify()
      console.log('✅ SMTP server connection verified successfully')
    } catch (verifyError) {
      console.error('❌ SMTP server connection verification failed:', verifyError)
      return false
    }

    // Send email
    const mailOptions = {
      from: smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully with Nodemailer:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    })

    return true
  } catch (error) {
    console.error('❌ Error sending email with Nodemailer:', error)
    return false
  }
}

// Main email sending function
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('📧 Attempting to send email to:', options.to)
  console.log('📧 Email options:', {
    to: options.to,
    subject: options.subject,
    hasHtml: !!options.html,
    hasText: !!options.text,
    from: options.from
  })
  
  // Try Nodemailer (primary email provider)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('📧 Sending email with Nodemailer (SMTP)...')
    try {
      const success = await sendEmailWithNodemailer(options)
      if (success) {
        console.log('✅ Email sent successfully with Nodemailer')
        return true
      } else {
        console.warn('❌ Nodemailer failed, trying fallback...')
      }
    } catch (error) {
      console.error('❌ Nodemailer error:', error)
      console.warn('❌ Nodemailer failed, trying fallback...')
    }
  } else {
    console.warn('⚠️ SMTP configuration missing, skipping Nodemailer')
  }

  // Fallback to SendGrid (optional)
  if (process.env.SENDGRID_API_KEY) {
    console.log('📧 Trying SendGrid fallback...')
    try {
      const success = await sendEmailWithSendGrid(options)
      if (success) {
        console.log('✅ Email sent successfully with SendGrid')
        return true
      } else {
        console.warn('❌ SendGrid also failed')
      }
    } catch (error) {
      console.error('❌ SendGrid error:', error)
    }
  } else {
    console.warn('⚠️ SendGrid API key missing, skipping SendGrid')
  }

  console.error('❌ All email providers failed. Please check your email configuration.')
  return false
}

// Send invitation email
export async function sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
  const { html, text } = generateInvitationEmail(data)
  
  return await sendEmail({
    to: data.recipientEmail,
    subject: `⚡ You're invited to join ${data.schoolName} on Riven!`,
    html,
    text,
  })
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{
  sendgrid: boolean
  smtp: boolean
  message: string
  priority: string
}> {
  const result = {
    sendgrid: !!process.env.SENDGRID_API_KEY,
    smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    message: '',
    priority: ''
  }

  // Check configuration status
  if (result.smtp) {
    result.message = 'Nodemailer (SMTP) is configured and ready to use'
    result.priority = 'Nodemailer (SMTP) → SendGrid (fallback)'
  } else if (result.sendgrid) {
    result.message = 'SendGrid is configured as primary email provider'
    result.priority = 'SendGrid only'
  } else {
    result.message = 'No email provider configured. Please set up SMTP settings.'
    result.priority = 'None configured'
  }

  return result
}

