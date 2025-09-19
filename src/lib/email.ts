// Email service for Vidyakosh LMS
// Supports multiple email providers: Resend, SendGrid, Nodemailer

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
}

// Email template for school invitations
export function generateInvitationEmail(data: InvitationEmailData): { html: string; text: string } {
  const { recipientName, schoolName, inviterName, invitationUrl, message, expiresAt } = data
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>School Invitation - Vidyakosh</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .content {
          margin-bottom: 30px;
        }
        .invitation-box {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .invitation-code {
          font-size: 18px;
          font-weight: bold;
          color: #0c4a6e;
          font-family: monospace;
          letter-spacing: 2px;
        }
        .cta-button {
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .cta-button:hover {
          background: #1d4ed8;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
        .expiry {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          margin: 15px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎓 Vidyakosh</div>
          <h1 class="title">You're Invited to Join ${schoolName}!</h1>
        </div>
        
        <div class="content">
          <p>Hello ${recipientName || 'there'},</p>
          
          <p><strong>${inviterName}</strong> has invited you to join <strong>${schoolName}</strong> on Vidyakosh, our comprehensive Learning Management System.</p>
          
          ${message ? `<p><em>"${message}"</em></p>` : ''}
          
          <div class="invitation-box">
            <p><strong>Your Invitation Code:</strong></p>
            <div class="invitation-code">${data.invitationCode}</div>
            <p style="margin-top: 10px; font-size: 14px;">Use this code to create your account</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="cta-button">Accept Invitation & Join School</a>
          </div>
          
          <div class="expiry">
            <strong>⏰ Important:</strong> This invitation expires on ${new Date(expiresAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <h3>What's Next?</h3>
          <ol>
            <li>Click the "Accept Invitation" button above</li>
            <li>Create your account using the invitation code</li>
            <li>Start exploring your school's courses and resources</li>
          </ol>
          
          <p>If you have any questions, please contact your school administrator or reply to this email.</p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent by ${inviterName} from ${schoolName}.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p style="margin-top: 20px;">
            <strong>Vidyakosh LMS</strong><br>
            Comprehensive Learning Management System for Schools
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🎓 Vidyakosh - School Invitation

Hello ${recipientName || 'there'},

${inviterName} has invited you to join ${schoolName} on Vidyakosh, our comprehensive Learning Management System.

${message ? `Message: "${message}"` : ''}

Your Invitation Code: ${data.invitationCode}

Accept your invitation: ${invitationUrl}

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

If you have any questions, please contact your school administrator.

This invitation was sent by ${inviterName} from ${schoolName}.
If you didn't expect this invitation, you can safely ignore this email.

Vidyakosh LMS - Comprehensive Learning Management System for Schools
  `

  return { html, text }
}

// Send email using Resend (recommended)
export async function sendEmailWithResend(options: EmailOptions): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      return false
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'Vidyakosh <onboarding@resend.dev>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return false
    }

    const result = await response.json()
    console.log('Email sent successfully with Resend:', result.id)
    return true
  } catch (error) {
    console.error('Error sending email with Resend:', error)
    return false
  }
}

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
        from: { email: options.from || 'noreply@vidyakosh.com', name: 'Vidyakosh' },
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
    // This would require nodemailer package
    // For now, we'll return false and suggest using Resend or SendGrid
    console.error('Nodemailer not implemented. Please use Resend or SendGrid.')
    return false
  } catch (error) {
    console.error('Error sending email with Nodemailer:', error)
    return false
  }
}

// Main email sending function with fallback
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('Attempting to send email to:', options.to)
  
  // Try Resend first (recommended)
  if (process.env.RESEND_API_KEY) {
    console.log('Trying Resend...')
    const success = await sendEmailWithResend(options)
    if (success) return true
  }

  // Fallback to SendGrid
  if (process.env.SENDGRID_API_KEY) {
    console.log('Trying SendGrid...')
    const success = await sendEmailWithSendGrid(options)
    if (success) return true
  }

  // Fallback to Nodemailer
  if (process.env.SMTP_HOST) {
    console.log('Trying Nodemailer...')
    const success = await sendEmailWithNodemailer(options)
    if (success) return true
  }

  console.error('All email providers failed. Please check your email configuration.')
  return false
}

// Send invitation email
export async function sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
  const { html, text } = generateInvitationEmail(data)
  
  return await sendEmail({
    to: data.recipientEmail,
    subject: `🎓 You're invited to join ${data.schoolName} on Vidyakosh!`,
    html,
    text,
  })
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{
  resend: boolean
  sendgrid: boolean
  smtp: boolean
  message: string
}> {
  const result = {
    resend: !!process.env.RESEND_API_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    message: ''
  }

  if (result.resend) {
    result.message = 'Resend is configured and ready to use'
  } else if (result.sendgrid) {
    result.message = 'SendGrid is configured and ready to use'
  } else if (result.smtp) {
    result.message = 'SMTP is configured and ready to use'
  } else {
    result.message = 'No email provider configured. Please set up Resend, SendGrid, or SMTP.'
  }

  return result
}

