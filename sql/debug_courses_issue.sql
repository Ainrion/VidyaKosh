-- Debug Courses Issue - Check why non-existent courses are showing
-- Run this in your Supabase SQL Editor to diagnose the problem

-- ========================================
-- 1. CHECK CURRENT RLS POLICIES ON COURSES
-- ========================================

SELECT 'Current RLS policies on courses table:' as info;
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
WHERE tablename = 'courses'
ORDER BY policyname;

-- ========================================
-- 2. CHECK RLS STATUS ON COURSES TABLE
-- ========================================

SELECT 'RLS status on courses table:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'courses';

-- ========================================
-- 3. CHECK ALL COURSES IN DATABASE
-- ========================================

SELECT 'All courses in database:' as info;
SELECT 
  id,
  title,
  description,
  school_id,
  created_by,
  created_at,
  archived
FROM courses
ORDER BY created_at DESC;

-- ========================================
-- 4. CHECK SCHOOLS TABLE
-- ========================================

SELECT 'All schools in database:' as info;
SELECT 
  id,
  name,
  email,
  created_at
FROM schools
ORDER BY created_at DESC;

-- ========================================
-- 5. CHECK PROFILES TABLE
-- ========================================

SELECT 'All profiles in database:' as info;
SELECT 
  id,
  full_name,
  email,
  role,
  school_id,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ========================================
-- 6. CHECK COURSES WITHOUT VALID SCHOOL REFERENCES
-- ========================================

SELECT 'Courses with invalid school_id references:' as info;
SELECT 
  c.id,
  c.title,
  c.school_id,
  s.name as school_name,
  CASE 
    WHEN s.id IS NULL THEN 'INVALID SCHOOL ID'
    ELSE 'VALID'
  END as status
FROM courses c
LEFT JOIN schools s ON c.school_id = s.id
ORDER BY status DESC, c.created_at DESC;

-- ========================================
-- 7. CHECK COURSES WITHOUT VALID CREATOR REFERENCES
-- ========================================

SELECT 'Courses with invalid created_by references:' as info;
SELECT 
  c.id,
  c.title,
  c.created_by,
  p.full_name as creator_name,
  CASE 
    WHEN p.id IS NULL THEN 'INVALID CREATOR ID'
    ELSE 'VALID'
  END as status
FROM courses c
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY status DESC, c.created_at DESC;

-- ========================================
-- 8. CHECK ENROLLMENTS TABLE
-- ========================================

SELECT 'All enrollments in database:' as info;
SELECT 
  id,
  course_id,
  student_id,
  enrolled_at
FROM enrollments
ORDER BY enrolled_at DESC;

-- ========================================
-- 9. TEST RLS POLICY EFFECTIVENESS
-- ========================================

-- This will show what a user with role 'student' would see
SELECT 'Testing RLS for student role (this should be empty if no enrollments):' as info;
-- Note: This is a simulation - actual RLS enforcement happens at query time

-- ========================================
-- 10. CHECK FOR ORPHANED DATA
-- ========================================

SELECT 'Orphaned enrollments (enrollments for non-existent courses):' as info;
SELECT 
  e.id as enrollment_id,
  e.course_id,
  e.student_id,
  CASE 
    WHEN c.id IS NULL THEN 'ORPHANED - COURSE NOT FOUND'
    ELSE 'VALID'
  END as status
FROM enrollments e
LEFT JOIN courses c ON e.course_id = c.id
WHERE c.id IS NULL;

SELECT 'Orphaned enrollments (enrollments for non-existent students):' as info;
SELECT 
  e.id as enrollment_id,
  e.course_id,
  e.student_id,
  CASE 
    WHEN p.id IS NULL THEN 'ORPHANED - STUDENT NOT FOUND'
    ELSE 'VALID'
  END as status
FROM enrollments e
LEFT JOIN profiles p ON e.student_id = p.id
WHERE p.id IS NULL;
