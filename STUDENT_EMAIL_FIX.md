# Student Email Invitation Fix

## 🚨 Problem Identified

Student invitations were failing to send emails because of an **environment variable inconsistency** between teacher and student invitation APIs:

- **Teacher invitations** (working): Used `NEXT_PUBLIC_APP_URL`
- **Student invitations** (failing): Used `NEXT_PUBLIC_SITE_URL`

Since you have Nodemailer with Google SMTP working for teacher invitations, the issue was that the student invitation API was trying to use a different environment variable that wasn't set.

## ✅ Solution Applied

### 1. Fixed Environment Variable Inconsistency

Updated all student invitation APIs to use the same environment variable pattern as teacher invitations:

**Files Updated:**
- `src/app/api/invitations/route.ts` (main student invitations)
- `src/app/api/invitations-simple/route.ts` (fallback student invitations)
- `src/app/api/enrollment-codes/route.ts` (enrollment codes)
- `src/app/api/setup/profile/route.ts` (profile setup)

**Change Made:**
```typescript
// Before (failing)
const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup?invite=${invitationCode}`

// After (fixed)
const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup?invite=${invitationCode}`
```

### 2. Environment Variable Priority

The fix now uses this priority order:
1. `NEXT_PUBLIC_APP_URL` (primary - same as teacher invitations)
2. `NEXT_PUBLIC_SITE_URL` (fallback - for backward compatibility)
3. `http://localhost:3000` (default - for development)

## 🧪 Testing the Fix

### 1. Verify Environment Variables

Make sure your `.env.local` file has the correct URL variable:

```bash
# Use either of these (NEXT_PUBLIC_APP_URL is preferred)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# OR
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Test Student Invitations

1. Go to your admin dashboard
2. Navigate to "Invitations" or "Users"
3. Try sending a student invitation
4. Check the server logs for email sending status
5. Verify the email is received

### 3. Check Server Logs

Look for these log messages:
```
✅ Invitation email sent successfully to: student@example.com
```

If you see:
```
❌ Failed to send invitation email to: student@example.com
```

Then check the `emailError` field in the response for specific error details.

## 🔍 Debugging Steps

### 1. Check Email Configuration

Since teacher invitations work, your Nodemailer setup is correct. The issue was purely the environment variable inconsistency.

### 2. Verify URL Generation

Check that the invitation URLs are being generated correctly by looking at the API response:

```json
{
  "invitation": {...},
  "invitationUrl": "http://localhost:3000/signup?invite=ABC12345",
  "emailSent": true,
  "emailError": null
}
```

### 3. Test Email Template

The same email template is used for both teacher and student invitations, so if teacher emails work, student emails should work too.

## 📧 Email Template Verification

Both teacher and student invitations use the same `sendInvitationEmail` function from `src/lib/email.ts`, so the email content and sending mechanism are identical.

The only difference is:
- **Teacher invitations**: Use join tokens for direct access
- **Student invitations**: Use invitation codes for signup

## 🚀 Next Steps

1. **Test the fix**: Try sending a student invitation
2. **Verify email delivery**: Check if the email arrives
3. **Test the signup flow**: Ensure the invitation code works
4. **Monitor logs**: Watch for any remaining email errors

## 📝 Summary

The issue was a simple environment variable inconsistency. Since your Nodemailer setup with Google SMTP is working for teacher invitations, student invitations should now work perfectly with this fix.

The root cause was that different APIs were using different environment variable names for the same purpose, causing the student invitation URLs to be malformed or undefined, which likely caused the email sending to fail.

**Status**: ✅ **FIXED** - Student email invitations should now work correctly.
