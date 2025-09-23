-- Debug course visibility issue
-- Run this in your Supabase SQL Editor to check the current state

-- 1. Check current user's profile and school
SELECT 'Current user profile:' as info;
SELECT id, full_name, email, role, school_id 
FROM profiles 
WHERE id = auth.uid();

-- 2. Check courses in the user's school
SELECT 'Courses in user school:' as info;
SELECT c.id, c.title, c.description, c.created_by, c.school_id, p.full_name as creator_name
FROM courses c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.school_id = (
  SELECT school_id FROM profiles WHERE id = auth.uid()
)
ORDER BY c.created_at DESC;

-- 3. Check all courses (for debugging)
SELECT 'All courses (for debugging):' as info;
SELECT c.id, c.title, c.description, c.created_by, c.school_id, p.full_name as creator_name
FROM courses c
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 4. Check RLS policies on courses table
SELECT 'Current RLS policies on courses:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'courses';
