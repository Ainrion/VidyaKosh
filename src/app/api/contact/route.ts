import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      organization, 
      organizationType, 
      subject, 
      message, 
      inquiryType 
    } = body

    // Validate required fields
    if (!name || !email || !organization || !organizationType || !subject || !message || !inquiryType) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Format organization type for display
    const formatOrganizationType = (type: string) => {
      const types: { [key: string]: string } = {
        'school': 'School',
        'coaching-center': 'Coaching Center',
        'college': 'College/University',
        'training-institute': 'Training Institute',
        'other': 'Other'
      }
      return types[type] || type
    }

    // Format inquiry type for display
    const formatInquiryType = (type: string) => {
      const types: { [key: string]: string } = {
        'demo': 'Request Demo',
        'pricing': 'Pricing Inquiry',
        'support': 'Technical Support',
        'partnership': 'Partnership',
        'custom': 'Custom Solution',
        'other': 'Other'
      }
      return types[type] || type
    }

    // Create HTML email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission - Riven LMS</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            padding: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
          }
          .field {
            margin-bottom: 15px;
          }
          .field-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
            display: block;
          }
          .field-value {
            color: #4b5563;
            padding: 8px 12px;
            background-color: #f9fafb;
            border-radius: 6px;
            border-left: 3px solid #3b82f6;
          }
          .message-content {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
            white-space: pre-wrap;
            font-family: inherit;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Riven LMS</div>
            <div class="subtitle">New Contact Form Submission</div>
          </div>

          <div class="section">
            <div class="section-title">Contact Information</div>
            <div class="field">
              <span class="field-label">Full Name:</span>
              <div class="field-value">${name}</div>
            </div>
            <div class="field">
              <span class="field-label">Email Address:</span>
              <div class="field-value">${email}</div>
            </div>
            ${phone ? `
            <div class="field">
              <span class="field-label">Phone Number:</span>
              <div class="field-value">${phone}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Organization Details</div>
            <div class="field">
              <span class="field-label">Organization Name:</span>
              <div class="field-value">${organization}</div>
            </div>
            <div class="field">
              <span class="field-label">Organization Type:</span>
              <div class="field-value">${formatOrganizationType(organizationType)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Inquiry Details</div>
            <div class="field">
              <span class="field-label">Inquiry Type:</span>
              <div class="field-value">
                <span class="badge">${formatInquiryType(inquiryType)}</span>
              </div>
            </div>
            <div class="field">
              <span class="field-label">Subject:</span>
              <div class="field-value">${subject}</div>
            </div>
            <div class="field">
              <span class="field-label">Message:</span>
              <div class="message-content">${message}</div>
            </div>
          </div>

          <div class="footer">
            <p>This message was sent from the Riven LMS contact form.</p>
            <p>Submitted on: ${new Date().toLocaleString('en-IN', { 
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Create plain text version
    const textTemplate = `
New Contact Form Submission - Riven LMS

Contact Information:
- Name: ${name}
- Email: ${email}
${phone ? `- Phone: ${phone}` : ''}

Organization Details:
- Organization: ${organization}
- Type: ${formatOrganizationType(organizationType)}

Inquiry Details:
- Type: ${formatInquiryType(inquiryType)}
- Subject: ${subject}
- Message: ${message}

Submitted on: ${new Date().toLocaleString('en-IN', { 
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
    `

    // Email options
    const mailOptions = {
      from: {
        name: 'Riven LMS Contact Form',
        address: process.env.SMTP_USER || 'noreply@riven.com'
      },
      to: 'info@ainrion.com',
      subject: `New Contact Form Submission: ${subject}`,
      text: textTemplate,
      html: htmlTemplate,
      replyTo: email
    }

    // Send email
    await transporter.sendMail(mailOptions)

    // Send confirmation email to the user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You - Riven LMS</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            padding: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
          }
          .content {
            text-align: center;
            margin-bottom: 30px;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 24px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .message {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white !important;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Riven LMS</div>
          </div>

          <div class="content">
            <div class="success-icon">✓</div>
            <h1 class="title">Thank You for Contacting Us!</h1>
            <p class="message">
              Hi ${name},<br><br>
              Thank you for reaching out to us. We've received your message and our team will get back to you within 24 hours.
            </p>
            <p class="message">
              In the meantime, feel free to explore our platform and learn more about how Riven can transform your educational institution.
            </p>
            <a href="https://www.riven.in/" class="cta-button">Visit Our Website</a>
            <a href="https://www.riven.in/pricing" class="cta-button">View Pricing</a>
          </div>

          <div class="footer">
            <p>Best regards,<br>The Riven Team</p>
            <p>This is an automated confirmation email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const confirmationMailOptions = {
      from: {
        name: 'Riven LMS',
        address: process.env.SMTP_USER || 'noreply@riven.com'
      },
      to: email,
      subject: 'Thank You for Contacting Riven LMS',
      html: confirmationHtml
    }

    // Send confirmation email
    await transporter.sendMail(confirmationMailOptions)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message sent successfully' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send message. Please try again later.' 
      },
      { status: 500 }
    )
  }
}
