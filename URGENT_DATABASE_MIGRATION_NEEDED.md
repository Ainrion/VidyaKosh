# 🚨 URGENT: Database Migration Required

## ⚠️ **Critical Issue**

The teacher invitation system requires a database migration that **MUST BE APPLIED IMMEDIATELY** for the system to work.

From the terminal logs, I can see:
```
Error fetching invitations: {
  code: '42703',
  message: 'column school_invitations.role does not exist'
}
```

## 🔧 **Required Action**

**You MUST run this SQL in your Supabase SQL Editor RIGHT NOW:**

```sql
-- Add role column to school_invitations table
ALTER TABLE school_invitations 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));

-- Update existing records to have 'student' role
UPDATE school_invitations 
SET role = 'student' 
WHERE role IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_invitations_role ON school_invitations(role);
CREATE INDEX IF NOT EXISTS idx_school_invitations_school_role ON school_invitations(school_id, role);
```

## 📋 **Steps to Apply**

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Create New Query**
4. **Copy and paste the SQL above**
5. **Click "Run"**

## ✅ **After Migration**

Once you apply the migration:
- ✅ Teacher invitations will load properly
- ✅ Teacher invitation links will work correctly
- ✅ The signup page will handle teacher invitations properly
- ✅ All database errors will be resolved

## 🚫 **Current Status Without Migration**

- ❌ Teacher invitation page shows database errors
- ❌ Teacher invitation links fail to validate
- ❌ Cannot create or manage teacher invitations
- ❌ System is partially broken

## 🎯 **This Migration is Safe**

- ✅ **Backward compatible** - existing student invitations will continue working
- ✅ **Non-destructive** - no data will be lost
- ✅ **Default values** - existing records get `role = 'student'`
- ✅ **Constraints** - only allows valid roles ('student', 'teacher', 'admin')

**PLEASE APPLY THIS MIGRATION NOW TO FIX THE SYSTEM!** 🚨




