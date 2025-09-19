-- Test script to verify profiles table has required columns
-- Run this after applying fix_profiles_table_missing_columns.sql

-- Check if all required columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN (
    'school_access_granted', 
    'school_access_granted_by', 
    'school_access_granted_at', 
    'invitation_id'
  )
ORDER BY column_name;

-- Test inserting a profile with the new columns (this should work)
-- Note: This is just a test - don't run in production without proper data
/*
INSERT INTO profiles (
  id, 
  school_id, 
  full_name, 
  email, 
  role,
  school_access_granted,
  school_access_granted_by,
  school_access_granted_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM schools LIMIT 1),
  'Test User',
  'test@example.com',
  'student',
  true,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  NOW()
);
*/
