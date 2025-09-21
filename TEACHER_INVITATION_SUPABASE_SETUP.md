# Teacher Invitation Supabase Setup Guide

## 🎯 **Overview**

This guide provides the complete Supabase setup required for the teacher invitation system, including database schema updates and SQL queries.

## 📋 **Required Database Changes**

### **1. Add Role Column to school_invitations Table**

The current `school_invitations` table needs a `role` column to support both student and teacher invitations.

#### **SQL Migration**

```sql
-- Add role column to school_invitations table
ALTER TABLE school_invitations 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));

-- Update existing records to have 'student' role
UPDATE school_invitations 
SET role = 'student' 
WHERE role IS NULL;

-- Add index on role column for better query performance
CREATE INDEX IF NOT EXISTS idx_school_invitations_role ON school_invitations(role);

-- Add composite index on school_id and role for efficient filtering
CREATE INDEX IF NOT EXISTS idx_school_invitations_school_role ON school_invitations(school_id, role);
```

#### **How to Apply**

**Option 1: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL above
5. Click **Run** to execute

**Option 2: Command Line**
```bash
# Run the migration file we created
psql -h your-supabase-host -U postgres -d postgres -f add_role_to_invitations.sql
```

**Option 3: Using the migration file**
```bash
# Apply the migration
supabase db push
```

### **2. Verify the Schema Update**

After applying the migration, verify the changes:

```sql
-- Check if role column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'school_invitations' 
AND column_name = 'role';

-- Check table structure
\d school_invitations;

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'school_invitations' 
AND indexname LIKE '%role%';
```

## 🔍 **Key Queries for Teacher Invitations**

### **1. Create Teacher Invitation**

```sql
INSERT INTO school_invitations (
    school_id,
    email,
    role,
    invitation_code,
    expires_at,
    invited_by,
    status
) VALUES (
    $1, -- school_id
    $2, -- email
    'teacher',
    $3, -- invitation_code
    $4, -- expires_at
    $5, -- invited_by (admin user id)
    'pending'
);
```

### **2. Fetch Teacher Invitations**

```sql
-- Get all teacher invitations for a school
SELECT 
    si.*,
    s.name as school_name,
    p.full_name as invited_by_name,
    p.email as invited_by_email
FROM school_invitations si
LEFT JOIN schools s ON si.school_id = s.id
LEFT JOIN profiles p ON si.invited_by = p.id
WHERE si.school_id = $1 
AND si.role = 'teacher'
ORDER BY si.created_at DESC;
```

### **3. Fetch Teacher Invitations by Status**

```sql
-- Get pending teacher invitations
SELECT * FROM school_invitations 
WHERE school_id = $1 
AND role = 'teacher' 
AND status = 'pending'
AND expires_at > NOW()
ORDER BY created_at DESC;

-- Get accepted teacher invitations
SELECT * FROM school_invitations 
WHERE school_id = $1 
AND role = 'teacher' 
AND status = 'accepted'
ORDER BY accepted_at DESC;

-- Get expired teacher invitations
SELECT * FROM school_invitations 
WHERE school_id = $1 
AND role = 'teacher' 
AND (status = 'expired' OR expires_at <= NOW())
ORDER BY created_at DESC;
```

### **4. Validate Teacher Invitation Code**

```sql
-- Validate invitation code for teacher signup
SELECT 
    si.*,
    s.name as school_name,
    s.id as school_id
FROM school_invitations si
LEFT JOIN schools s ON si.school_id = s.id
WHERE si.invitation_code = $1
AND si.email = $2
AND si.role = 'teacher'
AND si.status = 'pending'
AND si.expires_at > NOW();
```

### **5. Update Invitation Status**

```sql
-- Mark teacher invitation as accepted
UPDATE school_invitations 
SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = $2
WHERE id = $1;

-- Mark teacher invitation as expired
UPDATE school_invitations 
SET status = 'expired'
WHERE expires_at <= NOW() 
AND status = 'pending'
AND role = 'teacher';
```

### **6. Delete Teacher Invitation**

```sql
-- Delete a specific teacher invitation
DELETE FROM school_invitations 
WHERE id = $1 
AND role = 'teacher';
```

## 📊 **Statistics Queries**

### **Teacher Invitation Counts**

```sql
-- Get teacher invitation statistics for a school
SELECT 
    COUNT(*) FILTER (WHERE status = 'pending' AND expires_at > NOW()) as pending_count,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
    COUNT(*) FILTER (WHERE status = 'expired' OR expires_at <= NOW()) as expired_count,
    COUNT(*) as total_count
FROM school_invitations 
WHERE school_id = $1 
AND role = 'teacher';
```

## 🔐 **Row Level Security (RLS) Policies**

### **Teacher Invitation RLS Policies**

```sql
-- Allow admins to view teacher invitations from their school
CREATE POLICY "Admins can view teacher invitations from their school"
ON school_invitations
FOR SELECT
TO authenticated
USING (
    role = 'teacher' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin' 
        AND profiles.school_id = school_invitations.school_id
    )
);

-- Allow admins to create teacher invitations for their school
CREATE POLICY "Admins can create teacher invitations for their school"
ON school_invitations
FOR INSERT
TO authenticated
WITH CHECK (
    role = 'teacher' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin' 
        AND profiles.school_id = school_invitations.school_id
    )
);

-- Allow admins to update teacher invitations from their school
CREATE POLICY "Admins can update teacher invitations from their school"
ON school_invitations
FOR UPDATE
TO authenticated
USING (
    role = 'teacher' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin' 
        AND profiles.school_id = school_invitations.school_id
    )
);

-- Allow admins to delete teacher invitations from their school
CREATE POLICY "Admins can delete teacher invitations from their school"
ON school_invitations
FOR DELETE
TO authenticated
USING (
    role = 'teacher' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin' 
        AND profiles.school_id = school_invitations.school_id
    )
);
```

## 🔄 **Database Functions**

### **Auto-Expire Teacher Invitations Function**

```sql
-- Function to automatically expire old teacher invitations
CREATE OR REPLACE FUNCTION expire_old_teacher_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE school_invitations 
    SET status = 'expired'
    WHERE expires_at <= NOW() 
    AND status = 'pending'
    AND role = 'teacher';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule function to run daily (requires pg_cron extension)
-- SELECT cron.schedule('expire-teacher-invitations', '0 0 * * *', 'SELECT expire_old_teacher_invitations();');
```

## 📱 **API Integration**

### **Expected API Endpoints**

The following API endpoints should work with these queries:

1. **GET** `/api/invitations?role=teacher` - Fetch teacher invitations
2. **POST** `/api/invitations` - Create teacher invitation
3. **DELETE** `/api/invitations/{id}` - Delete teacher invitation
4. **POST** `/api/invitations/{id}/resend` - Resend teacher invitation email

### **Query Parameters**

- `role=teacher` - Filter for teacher invitations
- `status=pending|accepted|expired` - Filter by status
- `school_id={id}` - Filter by school (handled automatically by RLS)

## ✅ **Verification Steps**

After applying the migration, verify everything works:

### **1. Test Database Schema**
```sql
-- Verify role column exists
SELECT role FROM school_invitations LIMIT 1;

-- Check constraints
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'school_invitations'::regclass 
AND conname LIKE '%role%';
```

### **2. Test Teacher Invitation Creation**
```sql
-- Insert test teacher invitation
INSERT INTO school_invitations (
    school_id, email, role, invitation_code, expires_at, invited_by, status
) VALUES (
    1, 'test.teacher@example.com', 'teacher', 'TEST123', NOW() + INTERVAL '7 days', 'admin-user-id', 'pending'
);
```

### **3. Test Role Filtering**
```sql
-- Should return only teacher invitations
SELECT * FROM school_invitations WHERE role = 'teacher';

-- Should return only student invitations
SELECT * FROM school_invitations WHERE role = 'student';
```

## 🚀 **Migration Script**

Run this complete migration script:

```sql
-- Complete Teacher Invitation Migration
BEGIN;

-- Add role column
ALTER TABLE school_invitations 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));

-- Update existing records
UPDATE school_invitations 
SET role = 'student' 
WHERE role IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_school_invitations_role ON school_invitations(role);
CREATE INDEX IF NOT EXISTS idx_school_invitations_school_role ON school_invitations(school_id, role);

-- Create auto-expire function
CREATE OR REPLACE FUNCTION expire_old_teacher_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE school_invitations 
    SET status = 'expired'
    WHERE expires_at <= NOW() 
    AND status = 'pending'
    AND role = 'teacher';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Verify changes
SELECT 'Migration completed successfully' as status;

COMMIT;
```

## 📝 **Notes**

1. **Backward Compatibility**: Existing student invitations will continue to work with `role = 'student'`
2. **Default Value**: New invitations without a specified role will default to 'student'
3. **Constraints**: Role column only accepts 'student', 'teacher', or 'admin' values
4. **Indexes**: Added for optimal query performance on role-based filtering
5. **RLS Policies**: Ensure only admins can manage teacher invitations for their school

After applying this migration, your teacher invitation system should work perfectly! 🎉







