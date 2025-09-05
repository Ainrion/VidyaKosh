-- Fix RLS policies for courses table to ensure courses are visible
-- Run this in your Supabase SQL Editor

-- First, let's check the current RLS status
SELECT 'Current RLS status for courses:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'courses';

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view courses in their school" ON courses;
DROP POLICY IF EXISTS "Teachers can create courses in their school" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Students can view enrolled courses" ON courses;
DROP POLICY IF EXISTS "Public course access" ON courses;

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to view courses
CREATE POLICY "Authenticated users can view all courses" ON courses
FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for course creation
CREATE POLICY "Teachers and admins can create courses" ON courses
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

-- Create policy for course updates
CREATE POLICY "Course creators and admins can update courses" ON courses
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

-- Create policy for course deletion
CREATE POLICY "Course creators and admins can delete courses" ON courses
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_school_id ON courses(school_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- Verify the policies were created
SELECT 'Created policies for courses:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'courses';

-- Success message
SELECT '✅ Courses RLS policies fixed successfully!' as status;
SELECT 'All authenticated users can now view courses.' as message;
SELECT 'Teachers and admins can create/update/delete courses.' as details;
