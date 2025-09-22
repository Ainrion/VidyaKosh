-- Fix Assignment RLS Policies for Proper School-Based Filtering
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. DROP ALL EXISTING CONFLICTING POLICIES
-- ========================================

-- Drop all existing assignment policies to start fresh
DROP POLICY IF EXISTS "assignments_select_all" ON assignments;
DROP POLICY IF EXISTS "assignments_insert_teachers" ON assignments;
DROP POLICY IF EXISTS "assignments_update_teachers" ON assignments;
DROP POLICY IF EXISTS "assignments_delete_teachers" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can create assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can update assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can delete assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view enrolled course assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view enrolled assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can view own course assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can view school assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage own course assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage school assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage course assignments" ON assignments;
DROP POLICY IF EXISTS "Admins can view school assignments" ON assignments;
DROP POLICY IF EXISTS "Admins can manage school assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can update assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can delete assignments" ON assignments;

-- ========================================
-- 2. CREATE CLEAN, SCHOOL-BASED RLS POLICIES
-- ========================================

-- Ensure RLS is enabled
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can view assignments for courses they're enrolled in
CREATE POLICY "Students can view enrolled assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments, profiles
    WHERE enrollments.course_id = assignments.course_id
    AND enrollments.student_id = auth.uid()
    AND profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
);

-- Policy 2: Teachers can view all assignments in their school
CREATE POLICY "Teachers can view school assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles teacher_profile, courses
    WHERE teacher_profile.id = auth.uid()
    AND teacher_profile.role = 'teacher'
    AND courses.id = assignments.course_id
    AND courses.school_id = teacher_profile.school_id
  )
);

-- Policy 3: Teachers can manage assignments in their school
CREATE POLICY "Teachers can manage school assignments" ON assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles teacher_profile, courses
    WHERE teacher_profile.id = auth.uid()
    AND teacher_profile.role = 'teacher'
    AND courses.id = assignments.course_id
    AND courses.school_id = teacher_profile.school_id
  )
);

-- Policy 4: Admins can view all assignments in their school
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

-- Policy 5: Admins can manage all assignments in their school
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
-- 3. VERIFICATION QUERIES
-- ========================================

-- Check current policies
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

-- Check assignments table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- Check if assignments have proper school filtering
SELECT 
  'Assignment School Filtering Check' as status,
  COUNT(*) as total_assignments,
  COUNT(DISTINCT c.school_id) as unique_schools
FROM assignments a
JOIN courses c ON a.course_id = c.id;
