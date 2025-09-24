-- Test Blackboard Setup
-- Run this to verify everything is working

-- Check if blackboards table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blackboards') 
    THEN '✅ Blackboards table exists'
    ELSE '❌ Blackboards table missing'
  END as table_status;

-- Check if RLS is enabled
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'blackboards' AND c.relrowsecurity = true
    )
    THEN '✅ RLS is enabled'
    ELSE '❌ RLS is not enabled'
  END as rls_status;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'blackboards';

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'blackboards'
ORDER BY ordinal_position;

-- Test basic access (this should work for authenticated users)
SELECT COUNT(*) as blackboard_count FROM blackboards;

-- Check if we can see courses (needed for blackboard creation)
SELECT 
  c.id,
  c.title,
  c.school_id,
  p.role as user_role
FROM courses c
JOIN profiles p ON p.school_id = c.school_id
WHERE p.id = auth.uid()
LIMIT 5;
