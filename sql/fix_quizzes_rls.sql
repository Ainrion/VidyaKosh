-- Fix RLS policies for quizzes and quiz_questions tables
-- Run this in your Supabase SQL Editor

-- First, let's check the current RLS status
SELECT 'Current RLS status for quizzes:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('quizzes', 'quiz_questions');

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view quizzes in their school" ON quizzes;
DROP POLICY IF EXISTS "Teachers can create quizzes in their school" ON quizzes;
DROP POLICY IF EXISTS "Admins can manage all quizzes" ON quizzes;
DROP POLICY IF EXISTS "Students can view enrolled quizzes" ON quizzes;
DROP POLICY IF EXISTS "Public quiz access" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can view all quizzes" ON quizzes;
DROP POLICY IF EXISTS "Teachers and admins can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Quiz creators and admins can update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Quiz creators and admins can delete quizzes" ON quizzes;
DROP POLICY IF EXISTS "quizzes_select_policy" ON quizzes;
DROP POLICY IF EXISTS "quizzes_insert_policy" ON quizzes;
DROP POLICY IF EXISTS "quizzes_update_policy" ON quizzes;
DROP POLICY IF EXISTS "quizzes_delete_policy" ON quizzes;

-- Drop quiz_questions policies
DROP POLICY IF EXISTS "Users can view quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Teachers can create quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_select_policy" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_insert_policy" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_update_policy" ON quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_delete_policy" ON quiz_questions;

-- Enable RLS on quizzes table
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on quiz_questions table
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for testing
-- 1. Allow all authenticated users to view quizzes
CREATE POLICY "quizzes_select_policy" ON quizzes
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Allow teachers and admins to create quizzes
CREATE POLICY "quizzes_insert_policy" ON quizzes
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- 3. Allow quiz creators and admins to update quizzes
CREATE POLICY "quizzes_update_policy" ON quizzes
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = quizzes.course_id 
      AND courses.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- 4. Allow quiz creators and admins to delete quizzes
CREATE POLICY "quizzes_delete_policy" ON quizzes
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = quizzes.course_id 
      AND courses.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Quiz Questions Policies
-- 1. Allow all authenticated users to view quiz questions
CREATE POLICY "quiz_questions_select_policy" ON quiz_questions
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Allow teachers and admins to create quiz questions
CREATE POLICY "quiz_questions_insert_policy" ON quiz_questions
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- 3. Allow quiz creators and admins to update quiz questions
CREATE POLICY "quiz_questions_update_policy" ON quiz_questions
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM quizzes 
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND courses.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- 4. Allow quiz creators and admins to delete quiz questions
CREATE POLICY "quiz_questions_delete_policy" ON quiz_questions
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM quizzes 
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_questions.quiz_id 
      AND courses.created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Grant necessary permissions
GRANT ALL ON quizzes TO authenticated;
GRANT ALL ON quiz_questions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the policies
SELECT 'RLS policies created successfully!' as status;
