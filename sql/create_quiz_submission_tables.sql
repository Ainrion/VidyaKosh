-- Create Quiz Submission Tables
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. QUIZ_SUBMISSIONS TABLE
-- ========================================

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one submission per student per quiz
  UNIQUE(quiz_id, student_id)
);

-- ========================================
-- 2. QUIZ_ANSWERS TABLE
-- ========================================

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  student_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one answer per question per submission
  UNIQUE(submission_id, question_id)
);

-- ========================================
-- 3. INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes for quiz_submissions
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student_id ON quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_submitted_at ON quiz_submissions(submitted_at);

-- Indexes for quiz_answers
CREATE INDEX IF NOT EXISTS idx_quiz_answers_submission_id ON quiz_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);

-- ========================================
-- 4. RLS POLICIES
-- ========================================

-- Enable RLS on quiz_submissions
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own quiz submissions" ON quiz_submissions;
DROP POLICY IF EXISTS "Teachers and admins can view quiz submissions" ON quiz_submissions;
DROP POLICY IF EXISTS "Students can create quiz submissions" ON quiz_submissions;

-- Policy: Students can view their own quiz submissions
CREATE POLICY "Students can view their own quiz submissions" ON quiz_submissions
FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
    AND profiles.school_id = (
      SELECT courses.school_id 
      FROM quizzes 
      JOIN courses ON quizzes.course_id = courses.id 
      WHERE quizzes.id = quiz_submissions.quiz_id
    )
  )
);

-- Policy: Students can create quiz submissions
CREATE POLICY "Students can create quiz submissions" ON quiz_submissions
FOR INSERT WITH CHECK (
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
);

-- Enable RLS on quiz_answers
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view quiz answers for accessible submissions" ON quiz_answers;
DROP POLICY IF EXISTS "Students can create quiz answers" ON quiz_answers;

-- Policy: Users can view quiz answers for submissions they can access
CREATE POLICY "Users can view quiz answers for accessible submissions" ON quiz_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quiz_submissions
    WHERE quiz_submissions.id = quiz_answers.submission_id
    AND (
      quiz_submissions.student_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'teacher')
        AND profiles.school_id = (
          SELECT courses.school_id 
          FROM quizzes 
          JOIN courses ON quizzes.course_id = courses.id 
          WHERE quizzes.id = quiz_submissions.quiz_id
        )
      )
    )
  )
);

-- Policy: Students can create quiz answers
CREATE POLICY "Students can create quiz answers" ON quiz_answers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM quiz_submissions
    WHERE quiz_submissions.id = quiz_answers.submission_id
    AND quiz_submissions.student_id = auth.uid()
  )
);

-- ========================================
-- 5. GRANT PERMISSIONS
-- ========================================

-- Grant permissions to authenticated users
GRANT ALL ON quiz_submissions TO authenticated;
GRANT ALL ON quiz_answers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================
-- 6. UPDATE TRIGGERS
-- ========================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for quiz_submissions
DROP TRIGGER IF EXISTS update_quiz_submissions_updated_at ON quiz_submissions;
CREATE TRIGGER update_quiz_submissions_updated_at
    BEFORE UPDATE ON quiz_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. VERIFICATION QUERIES
-- ========================================

-- Verify tables were created
SELECT 'Tables created successfully' as status;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('quiz_submissions', 'quiz_answers')
ORDER BY table_name, ordinal_position;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('quiz_submissions', 'quiz_answers');
