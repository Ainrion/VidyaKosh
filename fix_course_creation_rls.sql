-- Fix RLS policies for course creation
-- Run this in your Supabase SQL Editor

-- First, let's check the current RLS status
SELECT 'Current RLS status for courses:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'courses';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view courses in their school" ON courses;
DROP POLICY IF EXISTS "Teachers can create courses in their school" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Students can view enrolled courses" ON courses;
DROP POLICY IF EXISTS "Public course access" ON courses;
DROP POLICY IF EXISTS "Authenticated users can view all courses" ON courses;
DROP POLICY IF EXISTS "Teachers and admins can create courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can update courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Users can view school courses" ON courses;
DROP POLICY IF EXISTS "Teachers and admins can create school courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can update school courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can delete school courses" ON courses;
DROP POLICY IF EXISTS "courses_select_all" ON courses;
DROP POLICY IF EXISTS "courses_insert_teachers" ON courses;
DROP POLICY IF EXISTS "courses_update_creator_admin" ON courses;
DROP POLICY IF EXISTS "courses_delete_creator_admin" ON courses;

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for testing
-- 1. Allow all authenticated users to view courses
CREATE POLICY "courses_select_policy" ON courses
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Allow teachers and admins to create courses
CREATE POLICY "courses_insert_policy" ON courses
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- 3. Allow course creators and admins to update courses
CREATE POLICY "courses_update_policy" ON courses
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- 4. Allow course creators and admins to delete courses
CREATE POLICY "courses_delete_policy" ON courses
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Grant necessary permissions
GRANT ALL ON courses TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the policies
SELECT 'RLS policies created successfully!' as status;
