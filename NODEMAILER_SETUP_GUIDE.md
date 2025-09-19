# 📧 Nodemailer Setup Guide - Replace Resend with SMTP

## 🎯 **Overview**

You can now use Nodemailer with SMTP instead of Resend for sending invitation emails. Nodemailer supports any SMTP provider including Gmail, Outlook, Yahoo, and custom SMTP servers.

## ✅ **What's Been Updated**

1. **✅ Nodemailer Package Installed**: `nodemailer` and `@types/nodemailer`
2. **✅ Full Nodemailer Implementation**: Complete SMTP email sending functionality
3. **✅ Priority Updated**: Nodemailer now takes priority over Resend
4. **✅ Enhanced Error Handling**: Better connection verification and error messages
5. **✅ Multiple SMTP Support**: Works with Gmail, Outlook, Yahoo, and custom servers

## 🚀 **Quick Setup Options**

### **Option 1: Gmail SMTP (Recommended for Testing)**

#### Step 1: Enable App Passwords
1. Go to your [Google Account](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (enable if not already)
3. **App passwords** → **Generate app password**
4. Select **Mail** and your device
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### Step 2: Add to Environment Variables
Create or update `.env.local`:
```env
# Remove Resend (optional)
# RESEND_API_KEY=your_resend_key

# Add Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=your-email@gmail.com
```

### **Option 2: Outlook SMTP**

#### Step 1: Enable App Passwords
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. **Advanced security options**
3. **App passwords** → **Create new app password**
4. Copy the password

#### Step 2: Add to Environment Variables
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@outlook.com
```

### **Option 3: Yahoo SMTP**

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@yahoo.com
```

### **Option 4: Custom SMTP Server**

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## 🔧 **Environment Variables Reference**

### **Required Variables**
```env
SMTP_HOST=smtp.gmail.com          # SMTP server hostname
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com    # Your email address
SMTP_PASS=your_app_password       # App password or SMTP password
```

### **Optional Variables**
```env
SMTP_FROM=your-email@gmail.com    # From address (defaults to SMTP_USER)
```

### **Port Reference**
- **587**: TLS (recommended for most providers)
- **465**: SSL (alternative for Gmail/Outlook)
- **25**: Unencrypted (not recommended)

## 🧪 **Testing Your Setup**

### **Step 1: Restart Development Server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### **Step 2: Test Configuration**
```bash
# Test email configuration
curl http://localhost:3000/api/test-email

# Expected response:
{
  "success": true,
  "configuration": {
    "resend": false,
    "sendgrid": false,
    "smtp": true,
    "message": "Nodemailer (SMTP) is configured and will be used first",
    "priority": "Nodemailer (SMTP) → Resend → SendGrid"
  }
}
```

### **Step 3: Send Test Email**
```bash
# Send test email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@gmail.com", "subject": "Test Email", "message": "Testing Nodemailer integration"}'
```

### **Step 4: Test Invitation Email**
1. Go to your admin dashboard
2. Navigate to invitation management
3. Send an invitation to a test email
4. Check if the email is received

## 🔍 **Troubleshooting**

### **Issue 1: "SMTP configuration missing"**
**Solutions:**
- ✅ Check all required variables are set: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
- ✅ Verify no typos in variable names
- ✅ Restart development server after adding variables

### **Issue 2: "SMTP server connection verification failed"**
**Solutions:**
- ✅ Use app passwords, not your regular password
- ✅ Enable 2-factor authentication first
- ✅ Check if SMTP is enabled for your email provider
- ✅ Try different port (587 vs 465)

### **Issue 3: "Authentication failed"**
**Solutions:**
- ✅ Verify email address and password are correct
- ✅ Use app password, not account password
- ✅ Check if "Less secure app access" is enabled (Gmail)
- ✅ Try generating a new app password

### **Issue 4: "Connection timeout"**
**Solutions:**
- ✅ Check internet connection
- ✅ Verify SMTP host and port are correct
- ✅ Try different port (587 vs 465)
- ✅ Check firewall settings

### **Issue 5: Emails going to spam**
**Solutions:**
- ✅ Use a verified domain email address
- ✅ Add proper SPF/DKIM records
- ✅ Avoid spam trigger words in subject/content
- ✅ Use a professional from address

## 📊 **Provider Comparison**

| Provider | Free Limit | Setup Difficulty | Delivery Rate | Recommended For |
|----------|------------|------------------|---------------|-----------------|
| **Gmail** | 500/day | Easy | High | Testing/Development |
| **Outlook** | 300/day | Easy | High | Testing/Development |
| **Yahoo** | 500/day | Easy | Medium | Testing/Development |
| **Custom SMTP** | Varies | Medium | High | Production |

## 🎯 **Complete .env.local Template**

```env
# ========================================
# NODEMAILER SMTP CONFIGURATION
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=your-email@gmail.com

# ========================================
# APPLICATION SETTINGS
# ========================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ========================================
# SUPABASE CONFIGURATION (if needed)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ========================================
# OTHER EMAIL PROVIDERS (optional fallbacks)
# ========================================
# RESEND_API_KEY=your_resend_key
# SENDGRID_API_KEY=your_sendgrid_key
```

## 🚀 **Benefits of Nodemailer**

### ✅ **Advantages**
- **Free**: No API costs for personal email providers
- **Reliable**: Direct SMTP connection, no third-party dependencies
- **Flexible**: Works with any SMTP provider
- **Secure**: Supports TLS/SSL encryption
- **Control**: Full control over email sending process

### ✅ **Perfect For**
- Development and testing
- Small to medium applications
- When you want to avoid API costs
- When you need full control over email delivery
- Integration with existing email infrastructure

## 📋 **Next Steps**

1. **Choose your SMTP provider** (Gmail recommended for testing)
2. **Set up app passwords** for your email account
3. **Add SMTP configuration** to `.env.local`
4. **Restart your development server**
5. **Test email sending** with the test endpoints
6. **Send invitation emails** to verify everything works

## 🎉 **Success Indicators**

You'll know Nodemailer is working when:
- ✅ Configuration test shows `"smtp": true`
- ✅ Test emails are sent successfully
- ✅ Invitation emails are delivered
- ✅ No more Resend API errors
- ✅ Full control over email delivery

**Your invitation system will now use Nodemailer with SMTP!** 🚀
