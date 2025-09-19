# Resend Email Setup Guide - Fix Email Not Sending

## 🚨 **Current Issue**
Your Resend API key is not being detected by the application. The test shows:
```json
{
  "resend": false,
  "sendgrid": false, 
  "smtp": false,
  "message": "No email provider configured"
}
```

## ✅ **Step-by-Step Fix**

### **Step 1: Create Environment File**
Create a file named `.env.local` in your project root with this content:

```bash
# Email Configuration for Vidyakosh LMS
RESEND_API_KEY=re_your_actual_api_key_here

# Your site URL (used in email links)
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Supabase Configuration (if not already set)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 2: Get Your Resend API Key**
1. **Go to**: https://resend.com
2. **Sign up/Login** to your account
3. **Go to API Keys** section
4. **Create a new API key** or copy existing one
5. **Replace** `re_your_actual_api_key_here` with your real API key

### **Step 3: Verify API Key Format**
Your Resend API key should look like:
```
re_1234567890abcdef_1234567890abcdef
```

**Common mistakes:**
- ❌ Missing `re_` prefix
- ❌ Extra spaces or quotes
- ❌ Wrong key (using domain key instead of API key)

### **Step 4: Restart Development Server**
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 5: Test Email Configuration**
```bash
# Test configuration
curl http://localhost:3001/api/test-email

# Expected response:
{
  "success": true,
  "configuration": {
    "resend": true,
    "sendgrid": false,
    "smtp": false,
    "message": "Resend configured successfully"
  }
}
```

### **Step 6: Send Test Email**
```bash
# Send test email to your email address
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "subject": "Test Email", "message": "Testing Resend integration"}'
```

## 🔧 **Troubleshooting**

### **Issue 1: Still shows "No email provider configured"**
**Solutions:**
- ✅ Check `.env.local` file exists in project root
- ✅ Verify API key format (starts with `re_`)
- ✅ Restart development server
- ✅ Check for typos in variable name: `RESEND_API_KEY`

### **Issue 2: "Invalid API key" error**
**Solutions:**
- ✅ Verify API key is correct from Resend dashboard
- ✅ Check if API key has proper permissions
- ✅ Ensure no extra spaces or characters

### **Issue 3: Emails not received**
**Solutions:**
- ✅ Check spam/junk folder
- ✅ Verify recipient email address is correct
- ✅ Check Resend dashboard for delivery status
- ✅ Ensure domain is verified in Resend (for production)

### **Issue 4: "Domain not verified" error**
**For Production:**
- ✅ Add your domain to Resend dashboard
- ✅ Verify DNS records
- ✅ Use verified domain in `from` field

**For Development:**
- ✅ Use `onboarding@resend.dev` as sender (allowed for testing)
- ✅ Or verify a custom domain

## 🧪 **Testing Commands**

### **Test 1: Check Configuration**
```bash
curl http://localhost:3001/api/test-email
```

### **Test 2: Send Test Email**
```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

### **Test 3: Test Invitation Email**
1. Go to `http://localhost:3001/admin/invitations`
2. Click "Send Invitation"
3. Enter email address
4. Check if email is received

## 📋 **Complete .env.local Template**

```bash
# ========================================
# EMAIL CONFIGURATION
# ========================================
RESEND_API_KEY=re_your_actual_api_key_here

# ========================================
# APPLICATION SETTINGS
# ========================================
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# ========================================
# SUPABASE CONFIGURATION (if needed)
# ========================================
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 **Expected Results After Fix**

### **Before Fix:**
```json
{
  "resend": false,
  "message": "No email provider configured"
}
```

### **After Fix:**
```json
{
  "resend": true,
  "message": "Resend configured successfully"
}
```

## 🚀 **Quick Fix Summary**

1. **Create** `.env.local` file in project root
2. **Add** your Resend API key: `RESEND_API_KEY=re_your_key`
3. **Restart** development server
4. **Test** with: `curl http://localhost:3001/api/test-email`
5. **Send** test email to verify delivery

**Once configured, invitation emails will work perfectly!** 🎉

## 📞 **Need Help?**

If you're still having issues:
1. **Check Resend dashboard** for API key status
2. **Verify email address** you're sending to
3. **Check server logs** for error messages
4. **Test with different email providers** (SendGrid, SMTP)

The email system is fully functional - it just needs the proper API key configuration!
