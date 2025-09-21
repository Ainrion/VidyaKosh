-- Fix assignment creation issues
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. ADD MISSING COLUMN
-- ========================================

-- Add created_by column to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_course_created_by ON assignments(course_id, created_by);

-- ========================================
-- 2. FIX RLS POLICIES
-- ========================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "assignments_select_all" ON assignments;
DROP POLICY IF EXISTS "assignments_insert_teachers" ON assignments;
DROP POLICY IF EXISTS "assignments_update_teachers" ON assignments;
DROP POLICY IF EXISTS "assignments_delete_teachers" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can create assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can update assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can delete assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view enrolled course assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can view own course assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage own course assignments" ON assignments;
DROP POLICY IF EXISTS "Admins can view school assignments" ON assignments;

-- Create clean, working RLS policies for assignments

-- Allow students to view assignments for courses they're enrolled in
CREATE POLICY "Students can view enrolled assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = assignments.course_id
    AND enrollments.student_id = auth.uid()
  )
);

-- Allow teachers to view and manage assignments for their courses
CREATE POLICY "Teachers can manage course assignments" ON assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = assignments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Allow admins to view all assignments in their school
CREATE POLICY "Admins can view school assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile, courses
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND courses.id = assignments.course_id
    AND courses.school_id = admin_profile.school_id
  )
);

-- Allow admins to manage assignments in their school
CREATE POLICY "Admins can manage school assignments" ON assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile, courses
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND courses.id = assignments.course_id
    AND courses.school_id = admin_profile.school_id
  )
);

-- ========================================
-- 3. UPDATE EXISTING DATA
-- ========================================

-- Update existing assignments to have created_by (optional - for existing data)
UPDATE assignments 
SET created_by = c.created_by
FROM courses c
WHERE assignments.course_id = c.id 
  AND assignments.created_by IS NULL;

-- ========================================
-- 4. VERIFICATION
-- ========================================

-- Check assignments table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- Check assignments data
SELECT 
  'Assignments Table Status' as status,
  COUNT(*) as total_assignments,
  COUNT(created_by) as assignments_with_creator,
  COUNT(DISTINCT course_id) as unique_courses
FROM assignments;

-- Show sample assignments
SELECT 
  id,
  title,
  course_id,
  created_by,
  created_at
FROM assignments 
ORDER BY created_at DESC
LIMIT 5;
