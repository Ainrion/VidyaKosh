-- Add teacher join tokens to school_invitations table
-- Run this in your Supabase SQL Editor

-- Add join_token column for teacher invitations
ALTER TABLE school_invitations 
ADD COLUMN IF NOT EXISTS join_token TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_school_invitations_join_token ON school_invitations(join_token);

-- Update existing teacher invitations to have join tokens
-- This will generate join tokens for existing teacher invitations
UPDATE school_invitations 
SET join_token = upper(substring(md5(random()::text) from 1 for 16))
WHERE role = 'teacher' 
  AND join_token IS NULL;

-- Verify the changes
SELECT 
  'Teacher Join Tokens Added' as status,
  COUNT(*) as total_teacher_invitations,
  COUNT(join_token) as invitations_with_join_tokens
FROM school_invitations 
WHERE role = 'teacher';

-- Show sample of updated invitations
SELECT 
  id,
  email,
  role,
  invitation_code,
  join_token,
  status,
  created_at
FROM school_invitations 
WHERE role = 'teacher'
ORDER BY created_at DESC
LIMIT 5;

