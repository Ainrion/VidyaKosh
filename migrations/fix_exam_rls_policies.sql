-- Fix RLS policies for exams to include DELETE permissions
-- Run this SQL in your Supabase SQL Editor after running the main exam migration

-- Add DELETE policy for exams
CREATE POLICY "Teachers can delete their exams" ON exams
  FOR DELETE USING (
    created_by = auth.uid() OR
    course_id IN (
      SELECT c.id FROM courses c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add DELETE policy for exam questions  
CREATE POLICY "Teachers can delete questions for their exams" ON exam_questions
  FOR DELETE USING (
    exam_id IN (
      SELECT e.id FROM exams e
      WHERE e.created_by = auth.uid()
    ) OR
    exam_id IN (
      SELECT e.id FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add INSERT policy for exam questions
CREATE POLICY "Teachers can insert questions for their exams" ON exam_questions
  FOR INSERT WITH CHECK (
    exam_id IN (
      SELECT e.id FROM exams e
      WHERE e.created_by = auth.uid()
    ) OR
    exam_id IN (
      SELECT e.id FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add UPDATE policy for exam questions
CREATE POLICY "Teachers can update questions for their exams" ON exam_questions
  FOR UPDATE USING (
    exam_id IN (
      SELECT e.id FROM exams e
      WHERE e.created_by = auth.uid()
    ) OR
    exam_id IN (
      SELECT e.id FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
