-- Optimized Wasabi Setup for Exam File Upload System
-- Run this SQL in your Supabase SQL Editor

-- ========================================
-- 1. ENHANCE EXAM QUESTIONS TABLE
-- ========================================

-- Add file management columns if they don't exist
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_path TEXT DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_requirements JSONB DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS word_limit INTEGER DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS rich_text_enabled BOOLEAN DEFAULT FALSE;

-- Add file upload tracking columns
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT NULL;

-- ========================================
-- 2. ENHANCE EXAM ANSWERS TABLE
-- ========================================

-- Ensure exam_answers table exists with all necessary columns
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  text_answer TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  file_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  file_metadata JSONB DEFAULT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exam_session_id, question_id)
);

-- Add updated_at trigger for exam_answers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_exam_answers_updated_at ON exam_answers;
CREATE TRIGGER update_exam_answers_updated_at
    BEFORE UPDATE ON exam_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. UPDATE QUESTION TYPE CONSTRAINT
-- ========================================

-- Update the question_type constraint to include new types
ALTER TABLE exam_questions 
DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;

ALTER TABLE exam_questions 
ADD CONSTRAINT exam_questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'file_upload', 'subjective'));

-- ========================================
-- 4. CREATE FILE MANAGEMENT INDEXES
-- ========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_questions_file_path ON exam_questions(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exam_questions_uploaded_at ON exam_questions(file_uploaded_at) WHERE file_uploaded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exam_answers_file_path ON exam_answers(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exam_answers_uploaded_at ON exam_answers(file_uploaded_at) WHERE file_uploaded_at IS NOT NULL;

-- ========================================
-- 5. OPTIMIZE RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Teachers and admins can manage exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Students can view their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Students can insert their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Students can update their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Teachers and admins can view exam answers for their courses" ON exam_answers;

-- Create optimized policies for exam_questions
CREATE POLICY "Authenticated users can view exam questions" ON exam_questions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can manage exam questions" ON exam_questions
FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

-- Create optimized policies for exam_answers
CREATE POLICY "Students can view their own exam answers" ON exam_answers
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  exam_session_id IN (
    SELECT id FROM exam_sessions WHERE student_id = auth.uid()
  )
);

CREATE POLICY "Students can insert their own exam answers" ON exam_answers
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  exam_session_id IN (
    SELECT id FROM exam_sessions WHERE student_id = auth.uid()
  )
);

CREATE POLICY "Students can update their own exam answers" ON exam_answers
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  exam_session_id IN (
    SELECT id FROM exam_sessions WHERE student_id = auth.uid()
  )
);

CREATE POLICY "Teachers and admins can view exam answers" ON exam_answers
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- ========================================
-- 6. CREATE FILE CLEANUP FUNCTION
-- ========================================

-- Function to clean up orphaned files (files in database but not in storage)
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS TABLE(
  table_name TEXT,
  record_id UUID,
  file_path TEXT,
  file_name TEXT
) AS $$
BEGIN
  -- Find orphaned exam question files
  RETURN QUERY
  SELECT 
    'exam_questions'::TEXT as table_name,
    eq.id as record_id,
    eq.file_path,
    eq.file_name
  FROM exam_questions eq
  WHERE eq.file_path IS NOT NULL
  AND eq.file_uploaded_at < NOW() - INTERVAL '1 day' -- Only check files uploaded more than 1 day ago
  AND NOT EXISTS (
    SELECT 1 FROM exam_answers ea 
    WHERE ea.file_path = eq.file_path
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. CREATE FILE STATISTICS VIEW
-- ========================================

-- View for file upload statistics
CREATE OR REPLACE VIEW file_upload_stats AS
SELECT 
  'exam_questions' as file_type,
  COUNT(*) as total_files,
  COUNT(file_path) as files_with_uploads,
  SUM(file_size) as total_size_bytes,
  AVG(file_size) as average_size_bytes,
  MAX(file_uploaded_at) as latest_upload
FROM exam_questions
UNION ALL
SELECT 
  'exam_answers' as file_type,
  COUNT(*) as total_files,
  COUNT(file_path) as files_with_uploads,
  SUM(file_size) as total_size_bytes,
  AVG(file_size) as average_size_bytes,
  MAX(file_uploaded_at) as latest_upload
FROM exam_answers;

-- ========================================
-- 8. VERIFY SETUP
-- ========================================

-- Check table structure
SELECT 
  'exam_questions' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'exam_questions'
AND column_name IN ('file_path', 'file_name', 'file_size', 'mime_type', 'file_uploaded_at', 'file_metadata')
ORDER BY ordinal_position;

-- Check exam_answers structure
SELECT 
  'exam_answers' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'exam_answers'
AND column_name IN ('file_path', 'file_name', 'file_size', 'mime_type', 'file_uploaded_at', 'file_metadata')
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('exam_questions', 'exam_answers')
AND indexname LIKE '%file%'
ORDER BY tablename, indexname;

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('exam_questions', 'exam_answers')
ORDER BY tablename, policyname;

-- Show file statistics
SELECT * FROM file_upload_stats;
