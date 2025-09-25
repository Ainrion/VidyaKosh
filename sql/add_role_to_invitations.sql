-- Add role column to school_invitations table to support teacher invitations
-- This migration adds a role column with default value 'student' for backward compatibility

-- Add the role column
ALTER TABLE school_invitations 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));

-- Update existing records to have 'student' role if they don't already have one
UPDATE school_invitations 
SET role = 'student' 
WHERE role IS NULL;

-- Add index on role column for better query performance
CREATE INDEX IF NOT EXISTS idx_school_invitations_role ON school_invitations(role);

-- Add composite index on school_id and role for efficient filtering
CREATE INDEX IF NOT EXISTS idx_school_invitations_school_role ON school_invitations(school_id, role);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'school_invitations' 
AND column_name = 'role';

-- Show sample data to confirm
SELECT id, email, role, status, created_at 
FROM school_invitations 
ORDER BY created_at DESC 
LIMIT 5;


