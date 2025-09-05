-- Fix user profile by creating a default school and assigning the user to it
-- Run this in Supabase SQL Editor

-- First, check if any schools exist
-- SELECT * FROM schools;

-- Create a default school if none exists
INSERT INTO schools (id, name, address, email, phone) 
VALUES (
  gen_random_uuid(), 
  'Default School', 
  'Sample Address', 
  'admin@defaultschool.edu',
  '+1-555-0123'
) 
ON CONFLICT DO NOTHING;

-- Update the user's profile to be assigned to the school
-- Replace 'your-user-id-here' with your actual user ID
UPDATE profiles 
SET school_id = (SELECT id FROM schools WHERE name = 'Default School' LIMIT 1)
WHERE school_id IS NULL;

-- Verify the update
SELECT p.full_name, p.role, s.name as school_name 
FROM profiles p 
LEFT JOIN schools s ON p.school_id = s.id 
WHERE p.full_name = 'Hardik Sharma';
