# Email Debugging Solution

## 🚨 Problem Analysis

You're experiencing intermittent email sending failures with the error:
```
Email sending failed: undefined
```

This suggests that the `emailError` field in the API response is `undefined`, which means the error is not being properly captured or returned.

## ✅ Solutions Implemented

### 1. Enhanced Error Logging

**Updated Files:**
- `src/app/api/invitations/route.ts` - Added detailed logging for email sending process
- `src/lib/email.ts` - Enhanced error handling and logging
- `src/components/admin/invitation-management.tsx` - Better error message handling

**Key Improvements:**
- Added comprehensive logging at each step of the email sending process
- Enhanced error capture with detailed error information
- Better error messages for different failure scenarios

### 2. Email Configuration Debug Tools

**New Files Created:**
- `src/app/api/test-email/route.ts` - API endpoint for testing email configuration
- `src/components/admin/email-debug.tsx` - Debug component for email testing
- `src/app/admin/email-debug/page.tsx` - Debug page for admins

**Features:**
- Check email configuration status
- Test email sending with custom messages
- View environment variable status
- Detailed error reporting

### 3. Improved Error Handling

**Enhanced Error Messages:**
- SMTP connection failures
- Authentication errors
- Configuration issues
- Provider-specific errors

## 🧪 How to Debug

### Step 1: Check Email Configuration

1. Navigate to `/admin/email-debug` in your admin dashboard
2. Click "Check Email Configuration"
3. Review the configuration status

### Step 2: Test Email Sending

1. In the email debug page, enter your email address
2. Click "Send Test Email"
3. Check if the email arrives
4. Review any error messages

### Step 3: Check Server Logs

Look for these log messages in your server console:

**Successful Email:**
```
📧 Attempting to send email to: student@example.com
📧 Email configuration check: { SMTP_HOST: true, SMTP_USER: true, SMTP_PASS: true, SENDGRID_API_KEY: false }
📧 Sending email with Nodemailer (SMTP)...
✅ SMTP server connection verified successfully
✅ Email sent successfully with Nodemailer
✅ Invitation email sent successfully to: student@example.com
```

**Failed Email:**
```
📧 Attempting to send email to: student@example.com
❌ SMTP server connection verification failed: [error details]
❌ Nodemailer failed, trying fallback...
❌ SendGrid API key missing, skipping SendGrid
❌ All email providers failed. Please check your email configuration.
```

### Step 4: Common Issues and Solutions

#### Issue 1: SMTP Connection Failed
**Symptoms:** `❌ SMTP server connection verification failed`
**Solutions:**
- Check if `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` are set correctly
- Verify SMTP server is accessible
- Check if port 587 is blocked by firewall

#### Issue 2: Authentication Failed
**Symptoms:** `❌ Error sending email with Nodemailer: Invalid login`
**Solutions:**
- Verify email credentials are correct
- Check if 2-factor authentication is enabled (use App Password for Gmail)
- Ensure account allows "less secure apps" or use OAuth2

#### Issue 3: Environment Variables Not Set
**Symptoms:** `⚠️ SMTP configuration missing, skipping Nodemailer`
**Solutions:**
- Create `.env.local` file with SMTP settings
- Restart your development server after adding environment variables

## 🔧 Environment Variables Setup

Create or update your `.env.local` file:

```bash
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# App URL (for invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: SendGrid fallback
SENDGRID_API_KEY=your-sendgrid-api-key
```

## 📧 Gmail SMTP Setup

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password as `SMTP_PASS`

3. **Environment Variables:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

## 🚀 Testing Steps

### 1. Test Email Configuration
```bash
curl http://localhost:3000/api/test-email
```

### 2. Send Test Email
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "subject": "Test", "message": "Testing email"}'
```

### 3. Test Student Invitation
1. Go to admin dashboard
2. Navigate to invitations
3. Send a student invitation
4. Check server logs for detailed error information

## 🔍 Troubleshooting Checklist

- [ ] Environment variables are set correctly
- [ ] Development server restarted after env changes
- [ ] SMTP credentials are valid
- [ ] Email server is accessible
- [ ] Firewall allows SMTP connections
- [ ] Check spam folder for test emails
- [ ] Verify email address format is correct

## 📊 Expected Behavior

**Working Configuration:**
- Email debug page shows all green checkmarks
- Test email arrives within 1-2 minutes
- Student invitations send successfully
- Server logs show success messages

**Failed Configuration:**
- Email debug page shows red X marks
- Test email fails to send
- Student invitations fail with specific error messages
- Server logs show detailed error information

## 🎯 Next Steps

1. **Use the debug tools** to identify the specific issue
2. **Check server logs** for detailed error information
3. **Test with a simple email** first before testing invitations
4. **Verify SMTP settings** with your email provider
5. **Contact support** if issues persist after following this guide

The enhanced logging and debug tools should now provide clear information about what's causing the email sending failures.
