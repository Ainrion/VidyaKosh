# Email Setup Guide for Vidyakosh LMS

## 🚨 Problem: Email Sending Failing

The invitation system is failing to send emails because no email provider is configured. This guide will help you set up email functionality using one of three recommended providers.

## 🎯 Solution: Choose Your Email Provider

### **Option 1: Resend (Recommended) ⭐**

Resend is the easiest and most reliable option for transactional emails.

#### **Setup Steps:**

1. **Sign up for Resend:**
   - Go to [resend.com](https://resend.com)
   - Create a free account
   - Verify your email address

2. **Get API Key:**
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Add to Environment Variables:**
   ```bash
   # Add to your .env.local file
   RESEND_API_KEY=re_your_api_key_here
   ```

4. **Verify Domain (Optional but Recommended):**
   - Add your domain in Resend dashboard
   - Add DNS records as instructed
   - This allows you to send from your own domain

#### **Benefits:**
- ✅ Free tier: 3,000 emails/month
- ✅ Easy setup
- ✅ Great deliverability
- ✅ Built for developers
- ✅ No complex configuration

---

### **Option 2: SendGrid**

SendGrid is a popular email service with good deliverability.

#### **Setup Steps:**

1. **Sign up for SendGrid:**
   - Go to [sendgrid.com](https://sendgrid.com)
   - Create a free account
   - Complete verification

2. **Get API Key:**
   - Go to Settings > API Keys
   - Create a new API key
   - Give it "Full Access" permissions
   - Copy the key

3. **Add to Environment Variables:**
   ```bash
   # Add to your .env.local file
   SENDGRID_API_KEY=SG.your_api_key_here
   ```

4. **Verify Sender Identity:**
   - Go to Settings > Sender Authentication
   - Verify a single sender or domain
   - This is required to send emails

#### **Benefits:**
- ✅ Free tier: 100 emails/day
- ✅ Good deliverability
- ✅ Advanced features
- ✅ Detailed analytics

---

### **Option 3: SMTP (Nodemailer)**

Use your own SMTP server or a service like Gmail.

#### **Setup Steps:**

1. **Choose SMTP Provider:**
   - Gmail (with App Password)
   - Outlook/Hotmail
   - Your own SMTP server
   - Services like Mailgun, Postmark, etc.

2. **Add Environment Variables:**
   ```bash
   # Add to your .env.local file
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

3. **For Gmail specifically:**
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password as SMTP_PASS

#### **Benefits:**
- ✅ Use existing email infrastructure
- ✅ Full control over email settings
- ✅ No third-party dependencies

---

## 🔧 Environment Variables Setup

Create or update your `.env.local` file with the appropriate variables:

```bash
# Choose ONE of the following email providers:

# Option 1: Resend (Recommended)
RESEND_API_KEY=re_your_api_key_here

# Option 2: SendGrid
SENDGRID_API_KEY=SG.your_api_key_here

# Option 3: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Required for all options
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🧪 Testing Your Email Configuration

### **1. Test Email Configuration:**
```bash
# Visit this URL to check your configuration
http://localhost:3000/api/test-email
```

### **2. Send Test Email:**
```bash
# POST request to test email sending
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "subject": "Test Email", "message": "Testing email functionality"}'
```

### **3. Test Invitation System:**
1. Go to `/admin/invitations`
2. Send an invitation to your email
3. Check if you receive the email
4. Check server logs for any errors

## 📧 Email Templates

The system includes beautiful HTML email templates for:

- **School Invitations**: Professional invitation emails with school branding
- **Test Emails**: Simple test emails to verify configuration
- **Responsive Design**: Works on all devices and email clients

### **Sample Invitation Email:**
```
🎓 Vidyakosh - School Invitation

Hello John,

Sarah Johnson has invited you to join Springfield High School on Vidyakosh, our comprehensive Learning Management System.

Your Invitation Code: ABC12345

Accept your invitation: http://localhost:3000/signup?invite=ABC12345

⏰ Important: This invitation expires on January 15, 2024 at 11:59 PM

What's Next?
1. Click the invitation link above
2. Create your account using the invitation code
3. Start exploring your school's courses and resources
```

## 🚀 Deployment Considerations

### **Production Setup:**

1. **Use a Custom Domain:**
   - Set up a custom domain for your emails
   - Configure SPF, DKIM, and DMARC records
   - This improves deliverability

2. **Environment Variables:**
   - Add email configuration to your production environment
   - Use secure environment variable management
   - Never commit API keys to version control

3. **Monitoring:**
   - Set up email delivery monitoring
   - Track bounce rates and delivery statistics
   - Monitor for failed email sends

### **Recommended Production Settings:**

```bash
# Production environment variables
RESEND_API_KEY=re_your_production_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 🔍 Troubleshooting

### **Common Issues:**

#### **1. "No email provider configured"**
- **Solution**: Add at least one email provider to your environment variables
- **Check**: Verify the variable names are correct

#### **2. "API key invalid"**
- **Solution**: Regenerate your API key
- **Check**: Ensure the key is copied correctly (no extra spaces)

#### **3. "Email not delivered"**
- **Solution**: Check spam folder first
- **Check**: Verify sender authentication (SendGrid)
- **Check**: Check email provider logs

#### **4. "Rate limit exceeded"**
- **Solution**: Wait for rate limit to reset
- **Check**: Upgrade your email provider plan if needed

### **Debug Steps:**

1. **Check Configuration:**
   ```bash
   curl http://localhost:3000/api/test-email
   ```

2. **Check Server Logs:**
   - Look for email-related errors in console
   - Check for API key validation errors

3. **Test with Different Providers:**
   - Try Resend if SendGrid fails
   - Try SendGrid if Resend fails

## 📊 Email Provider Comparison

| Provider | Free Tier | Setup Difficulty | Deliverability | Best For |
|----------|-----------|------------------|----------------|----------|
| **Resend** | 3,000/month | ⭐ Easy | ⭐⭐⭐⭐⭐ Excellent | Most users |
| **SendGrid** | 100/day | ⭐⭐ Medium | ⭐⭐⭐⭐ Good | High volume |
| **SMTP** | Varies | ⭐⭐⭐ Hard | ⭐⭐⭐ Varies | Custom setup |

## 🎯 Quick Start (Recommended)

**For most users, we recommend Resend:**

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add `RESEND_API_KEY=re_your_key` to `.env.local`
4. Test with `/api/test-email`
5. Start sending invitations!

## 📞 Support

If you're still having issues:

1. **Check the test endpoint**: `/api/test-email`
2. **Review server logs** for specific error messages
3. **Try a different email provider** as a fallback
4. **Verify environment variables** are loaded correctly

The email system is now fully implemented and ready to use! 🎉

