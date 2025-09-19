# 📧 Supabase Gmail SMTP Setup Guide

## 🎯 Goal
Configure Supabase to send email confirmations using your Gmail SMTP settings.

## 🔍 Current Situation
- ✅ Your app uses Gmail SMTP (working for invitation emails)
- ❌ Supabase doesn't use your SMTP (no confirmation emails sent)
- ❌ New teachers can't receive confirmation emails

## 🛠️ Solution: Configure Supabase SMTP

### Step 1: Go to Supabase Dashboard
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sukizydjcwupcogcvagg`
3. Navigate to **Authentication** → **Settings**

### Step 2: Configure SMTP Settings
1. **Scroll down to "SMTP Settings"**
2. **Enable "Enable custom SMTP"**
3. **Fill in these exact values:**

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: hardik2004s@gmail.com
SMTP Password: jydi bxqc khjp kuab
SMTP Admin Email: hardik2004s@gmail.com
```

### Step 3: Enable Email Confirmations
1. **In the same Settings page:**
2. **Find "Enable email confirmations"**
3. **Turn it ON**
4. **Save the settings**

### Step 4: Configure URLs
1. **Set Site URL:**
   ```
   Site URL: http://localhost:3000
   ```

2. **Add Redirect URLs:**
   ```
   Redirect URLs:
   - http://localhost:3000/auth/callback
   - http://localhost:3000/**
   ```

### Step 5: Test Email Confirmations
1. **Go to Authentication → Email Templates**
2. **Customize the "Confirm your signup" template if needed**
3. **Test with a new teacher signup**

## 🧪 Testing Steps

### Test 1: New Teacher Signup
1. Create a new teacher account
2. Check if confirmation email is sent
3. Click the confirmation link
4. Try logging in

### Test 2: Manual Confirmation
If emails still don't work:
1. Go to **Authentication → Users**
2. Find the new teacher
3. Click **"Confirm User"** button
4. Teacher can then login

## 🔧 Alternative: Disable Email Confirmations

If SMTP setup doesn't work immediately:

### Temporary Solution:
1. **Go to Authentication → Settings**
2. **Turn OFF "Enable email confirmations"**
3. **Save settings**
4. **New users can login immediately without confirmation**

⚠️ **Warning:** This reduces security but allows immediate access.

## 📋 Troubleshooting

### If Gmail SMTP doesn't work:
1. **Check Gmail App Password:**
   - Go to Google Account Settings
   - Enable 2-Factor Authentication
   - Generate App Password
   - Use the App Password instead of regular password

2. **Check Gmail Settings:**
   - Enable "Less secure app access" (if needed)
   - Or use OAuth2 instead of password

3. **Try Different SMTP Provider:**
   - SendGrid
   - Mailgun
   - AWS SES

### Common Issues:
- **"Authentication failed"** → Wrong password or need App Password
- **"Connection timeout"** → Check port (587 vs 465)
- **"Relay denied"** → Gmail security settings

## ✅ Expected Result

After configuration:
- ✅ New teachers receive confirmation emails
- ✅ Emails contain working confirmation links
- ✅ Teachers can confirm and login
- ✅ Login flow works end-to-end

## 🎯 Quick Test Command

After setup, test with:
```bash
node check-supabase-email-config.js
```

This will verify if email confirmations are working properly.

## 📞 Next Steps

1. **Configure SMTP in Supabase Dashboard** (Steps 1-4)
2. **Test with new teacher signup**
3. **If still not working, disable confirmations temporarily**
4. **Report back with results**

---

**Your Gmail SMTP Details:**
- Host: `smtp.gmail.com`
- Port: `587`
- User: `hardik2004s@gmail.com`
- Password: `jydi bxqc khjp kuab`
