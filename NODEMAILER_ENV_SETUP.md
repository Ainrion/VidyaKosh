# 🔧 Nodemailer Environment Setup Guide

## 📋 **Quick Setup Instructions**

Since you already have a `.env.local` file, you need to add the Nodemailer SMTP configuration to it.

### **Step 1: Add SMTP Configuration**

Add these lines to your existing `.env.local` file:

```env
# ========================================
# NODEMAILER SMTP CONFIGURATION (Primary)
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM=your-email@gmail.com
```

### **Step 2: Configure Your Email Provider**

Choose one of the following configurations:

#### **Option A: Gmail (Recommended)**

1. **Enable 2-Step Verification** in your Google Account
2. **Generate App Password**:
   - Go to Google Account → Security → App passwords
   - Select "Mail" and generate a 16-character password
3. **Update your `.env.local`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   SMTP_FROM=your-email@gmail.com
   ```

#### **Option B: Outlook/Hotmail**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@outlook.com
```

#### **Option C: Yahoo**

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your_app_password
SMTP_FROM=your-email@yahoo.com
```

#### **Option D: Custom SMTP Server**

```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

### **Step 3: Complete .env.local Template**

Here's a complete template for your `.env.local` file:

```env
# ========================================
# VIDYAKOSH LMS ENVIRONMENT CONFIGURATION
# ========================================

# ========================================
# NODEMAILER SMTP CONFIGURATION (Primary)
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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ========================================
# FALLBACK EMAIL PROVIDERS (Optional)
# ========================================
# Uncomment if you want to use SendGrid as a fallback

# SendGrid (Fallback)
# SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
```

## 🧪 **Testing Your Configuration**

### **Step 1: Restart Development Server**
```bash
npm run dev
```

### **Step 2: Test SMTP Configuration**
```bash
node test-nodemailer.js
```

### **Step 3: Send Test Email**
```bash
node test-nodemailer.js your-email@gmail.com
```

### **Step 4: Test in Application**
```bash
curl http://localhost:3000/api/test-email
```

Expected response:
```json
{
  "success": true,
  "configuration": {
    "sendgrid": false,
    "smtp": true,
    "message": "Nodemailer (SMTP) is configured and ready to use",
    "priority": "Nodemailer (SMTP) → SendGrid (fallback)"
  }
}
```

## 🔍 **Gmail App Password Setup (Detailed)**

### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on **2-Step Verification**
3. Follow the setup process

### **Step 2: Generate App Password**
1. In Security settings, click **App passwords**
2. Select **Mail** as the app
3. Select your device or create a custom name
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### **Step 3: Use App Password**
- **DO NOT** use your regular Gmail password
- **DO** use the 16-character app password
- **REMOVE** spaces when entering in `.env.local`

Example:
```env
SMTP_PASS=abcdefghijklmnop
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Authentication failed"**
**Solutions:**
- ✅ Use app password, not regular password
- ✅ Enable 2-factor authentication first
- ✅ Remove spaces from app password

### **Issue 2: "Connection failed"**
**Solutions:**
- ✅ Check SMTP host and port are correct
- ✅ Verify internet connection
- ✅ Check firewall settings

### **Issue 3: "Permission denied"**
**Solutions:**
- ✅ Enable 2-factor authentication
- ✅ Generate new app password
- ✅ Check if SMTP is enabled for your provider

### **Issue 4: "Configuration missing"**
**Solutions:**
- ✅ Check all SMTP_* variables are set
- ✅ Restart development server
- ✅ Verify no typos in variable names

### **Issue 5: Emails going to spam**
**Solutions:**
- ✅ Use verified domain email
- ✅ Avoid spam trigger words
- ✅ Use professional from address

## 📊 **Provider Comparison**

| Provider | Free Limit | Setup Difficulty | Delivery Rate | Best For |
|----------|------------|------------------|---------------|----------|
| **Gmail** | 500/day | Easy | High | Testing/Development |
| **Outlook** | 300/day | Easy | High | Testing/Development |
| **Yahoo** | 500/day | Easy | Medium | Testing/Development |
| **Custom** | Varies | Medium | High | Production |

## 🎯 **Quick Start Checklist**

- [ ] Choose email provider (Gmail recommended)
- [ ] Enable 2-factor authentication
- [ ] Generate app password
- [ ] Add SMTP configuration to `.env.local`
- [ ] Restart development server
- [ ] Test configuration with `node test-nodemailer.js`
- [ ] Send test email
- [ ] Verify invitation emails work in application

## 🚀 **Next Steps**

Once your `.env.local` is configured:

1. **Test the setup** using the test commands above
2. **Send invitation emails** from your admin dashboard
3. **Monitor email delivery** and adjust settings as needed
4. **Set up fallback providers** if desired (Resend/SendGrid)

## 📞 **Need Help?**

If you're still having issues:
1. Check the server logs for detailed error messages
2. Verify your app password is correct
3. Test with a different email provider
4. Review the troubleshooting section above

**Your Nodemailer setup will be complete once you add the SMTP configuration to your existing `.env.local` file!** 🎉
