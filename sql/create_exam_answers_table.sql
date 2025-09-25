-- Create exam_answers table for storing student answers (including file uploads)
-- Run this SQL in your Supabase SQL Editor

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

-- Enable Row Level Security
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exam_answers
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

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exam_answers'
ORDER BY ordinal_position;

