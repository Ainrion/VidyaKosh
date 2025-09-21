# Email Provider Setup Guide

## Current Issue
Resend is only sending emails to your main email address due to domain verification requirements.

## Available Email Providers

The system already supports multiple email providers with automatic fallback:
1. **Resend** (currently configured)
2. **SendGrid** (recommended alternative)
3. **SMTP** (Gmail/Outlook)

## Option 1: SendGrid Setup (Recommended)

### Step 1: Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Get API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Choose "Restricted Access"
4. Give it "Mail Send" permissions
5. Copy the API key

### Step 3: Update Environment Variables
Add to your `.env.local` file:
```env
# Remove or comment out Resend
# RESEND_API_KEY=your_resend_key

# Add SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### Step 4: Test SendGrid
The system will automatically use SendGrid when Resend is not available.

## Option 2: Gmail SMTP Setup

### Step 1: Enable App Passwords
1. Go to your Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. App passwords → Generate app password
4. Copy the 16-character password

### Step 2: Update Environment Variables
Add to your `.env.local` file:
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=your-email@gmail.com
```

## Option 3: Outlook SMTP Setup

### Step 1: Enable App Passwords
1. Go to Microsoft Account security settings
2. Advanced security options
3. App passwords → Create new app password
4. Copy the password

### Step 2: Update Environment Variables
Add to your `.env.local` file:
```env
# SMTP Configuration for Outlook
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@outlook.com
```

## Option 4: Mailgun Setup

### Step 1: Create Mailgun Account
1. Go to [mailgun.com](https://mailgun.com)
2. Sign up for free account (10,000 emails/month free)
3. Verify your domain or use sandbox domain

### Step 2: Get API Key
1. Go to API Keys section
2. Copy your Private API key

### Step 3: Update Environment Variables
Add to your `.env.local` file:
```env
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_domain.mailgun.org
```

## Testing Email Configuration

### Test Current Setup
Create a test file to check your email configuration:

```javascript
// test-email.js
import { testEmailConfiguration, sendEmail } from './src/lib/email.js'

async function testEmail() {
  // Check configuration
  const config = await testEmailConfiguration()
  console.log('Email Configuration:', config)
  
  // Send test email
  const success = await sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<h1>Test Email</h1><p>This is a test email.</p>',
    text: 'Test Email - This is a test email.'
  })
  
  console.log('Email sent:', success)
}

testEmail()
```

## Recommended Setup

For production use, I recommend **SendGrid** because:
- ✅ Free tier: 100 emails/day
- ✅ No domain verification required for basic use
- ✅ Reliable delivery
- ✅ Good reputation with email providers
- ✅ Easy setup

## Environment Variables Summary

```env
# Choose ONE email provider:

# Option 1: SendGrid (Recommended)
SENDGRID_API_KEY=your_sendgrid_api_key

# Option 2: Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@gmail.com

# Option 3: Outlook SMTP
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@outlook.com

# Option 4: Mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_domain.mailgun.org

# Remove Resend if not working
# RESEND_API_KEY=your_resend_key
```

## Next Steps

1. **Choose an email provider** (SendGrid recommended)
2. **Set up the account** and get API keys
3. **Update your `.env.local`** file
4. **Restart your development server**
5. **Test email sending** with a teacher invitation

## Troubleshooting

### SendGrid Issues
- Make sure API key has "Mail Send" permissions
- Check if you're using the correct API key
- Verify your account is not suspended

### SMTP Issues
- Make sure 2-factor authentication is enabled
- Use app passwords, not your regular password
- Check if your email provider allows SMTP

### General Issues
- Check server logs for error messages
- Verify environment variables are loaded correctly
- Test with a simple email first

