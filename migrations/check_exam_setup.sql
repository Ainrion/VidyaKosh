-- Check if exam tables exist in your Supabase database
-- Run this SQL in your Supabase SQL Editor to check the current state

-- Check if exam tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('exams', 'exam_questions', 'exam_sessions') THEN 'EXAM TABLE'
    ELSE 'OTHER TABLE'
  END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('exams', 'exam_questions', 'exam_sessions', 'courses', 'profiles')
ORDER BY table_name;

-- Check if RLS is enabled on exam tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('exams', 'exam_questions', 'exam_sessions');

-- Check existing policies on exam tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'exam%';
