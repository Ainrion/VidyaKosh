-- Fix Exam File Upload Schema
-- Run this SQL in your Supabase SQL Editor to add missing columns and tables

-- ========================================
-- 1. ADD FILE COLUMNS TO EXAM_QUESTIONS
-- ========================================

-- Add file-related columns to exam_questions table
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_path TEXT DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT NULL;

-- Add other missing columns
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_requirements JSONB DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS word_limit INTEGER DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS rich_text_enabled BOOLEAN DEFAULT FALSE;

-- ========================================
-- 2. UPDATE QUESTION TYPE CONSTRAINT
-- ========================================

-- Update the question_type constraint to include new types
ALTER TABLE exam_questions 
DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;

ALTER TABLE exam_questions 
ADD CONSTRAINT exam_questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'file_upload', 'subjective'));

-- ========================================
-- 3. CREATE EXAM_ANSWERS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  text_answer TEXT, -- For text-based answers
  file_path TEXT, -- Path to uploaded file in storage
  file_name TEXT, -- Original filename
  file_size INTEGER, -- File size in bytes
  mime_type TEXT, -- MIME type of uploaded file
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exam_session_id, question_id) -- One answer per question per session
);

-- Enable Row Level Security for exam_answers
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CREATE RLS POLICIES FOR EXAM_ANSWERS
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Students can insert their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Students can update their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Teachers and admins can view exam answers for their courses" ON exam_answers;

-- Create new policies
CREATE POLICY "Students can view their own exam answers" ON exam_answers
FOR SELECT USING (
  auth.uid() IN (
    SELECT student_id FROM exam_sessions WHERE id = exam_session_id
  )
);

CREATE POLICY "Students can insert their own exam answers" ON exam_answers
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT student_id FROM exam_sessions WHERE id = exam_session_id
  )
);

CREATE POLICY "Students can update their own exam answers" ON exam_answers
FOR UPDATE USING (
  auth.uid() IN (
    SELECT student_id FROM exam_sessions WHERE id = exam_session_id
  )
);

CREATE POLICY "Teachers and admins can view exam answers for their courses" ON exam_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_sessions es
    JOIN exams e ON es.exam_id = e.id
    JOIN courses c ON e.course_id = c.id
    JOIN profiles p ON c.created_by = p.id
    WHERE es.id = exam_session_id
    AND (p.id = auth.uid() OR p.role IN ('admin', 'teacher'))
  )
);

-- ========================================
-- 5. VERIFY THE CHANGES
-- ========================================

-- Check exam_questions table structure
SELECT 
  'exam_questions table' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'exam_questions'
ORDER BY ordinal_position;

-- Check exam_answers table structure
SELECT 
  'exam_answers table' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'exam_answers'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
  tc.constraint_name, 
  tc.constraint_type, 
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'exam_questions' 
AND tc.constraint_type = 'CHECK';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('exam_answers')
ORDER BY tablename, policyname;
