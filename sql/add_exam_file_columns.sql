-- Add file upload columns to exam_questions table
-- Run this SQL in your Supabase SQL Editor

-- Add file-related columns to exam_questions table
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_path TEXT DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT NULL;

-- Update the question_type constraint to include 'file_upload' and 'subjective'
ALTER TABLE exam_questions 
DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;

ALTER TABLE exam_questions 
ADD CONSTRAINT exam_questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'file_upload', 'subjective'));

-- Add file_requirements, word_limit, and rich_text_enabled columns if they don't exist
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_requirements JSONB DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS word_limit INTEGER DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS rich_text_enabled BOOLEAN DEFAULT FALSE;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'exam_questions'
ORDER BY ordinal_position;

