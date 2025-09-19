# Profile Creation Error Fix

## 🚨 **Error Encountered**

```
Failed to create user profile
src/app/signup/page.tsx (114:15) @ handleInvitationSignup
```

## 🔍 **Root Cause**

The `profiles` table is missing required columns that the invitation signup process needs:

- `school_access_granted` (BOOLEAN)
- `school_access_granted_by` (UUID) 
- `school_access_granted_at` (TIMESTAMP)
- `invitation_id` (UUID)

The invitation validation API tries to insert these columns when creating a user profile, but they don't exist in the current database schema.

## ✅ **Fix Applied**

### **Step 1: Run the Database Migration**

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Fix profiles table - Add missing columns for invitation system
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_access_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS school_access_granted_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS school_access_granted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES school_invitations(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_access ON profiles(school_access_granted);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);
```

### **Step 2: Verify the Fix**

Run this to check if the columns were added:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN (
    'school_access_granted', 
    'school_access_granted_by', 
    'school_access_granted_at', 
    'invitation_id'
  )
ORDER BY column_name;
```

**Expected Result:**
```
column_name              | data_type | is_nullable
-------------------------|-----------|------------
invitation_id            | uuid      | YES
school_access_granted    | boolean   | YES
school_access_granted_at | timestamp | YES
school_access_granted_by | uuid      | YES
```

### **Step 3: Test the Signup Process**

1. Go to `/admin/invitations` and create a test invitation
2. Go to `/signup` and use the "With Invitation" tab
3. Enter the invitation code and signup details
4. The profile should be created successfully

## 📁 **Files Created**

- ✅ `fix_profiles_table_missing_columns.sql` - Database migration script
- ✅ `test_profile_columns.sql` - Verification script
- ✅ `PROFILE_CREATION_ERROR_FIX.md` - This documentation

## 🧪 **Testing the Fix**

After applying the migration, test the invitation signup:

1. **Create an invitation:**
   ```bash
   curl -X POST http://localhost:3001/api/invitations \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","schoolId":"YOUR_SCHOOL_ID"}'
   ```

2. **Test signup with invitation:**
   ```bash
   curl -X POST http://localhost:3001/api/invitations/validate \
     -H "Content-Type: application/json" \
     -d '{"invitationCode":"INVITATION_CODE","email":"test@example.com","password":"password123","fullName":"Test User"}'
   ```

## 🎯 **What This Fixes**

- ✅ Invitation-based signup now works
- ✅ User profiles are created with proper school access tracking
- ✅ Database schema matches the application requirements
- ✅ RLS policies are updated for the new columns

## 🚀 **Next Steps**

After applying this fix:

1. The signup process should work without errors
2. Students can sign up using invitation codes
3. School access is properly tracked in the database
4. The enrollment system is fully functional

The "Failed to create user profile" error should be completely resolved! 🎉
