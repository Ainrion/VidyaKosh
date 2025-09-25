-- Enhance Exam Schema for Subjective Papers and File Uploads
-- Run this SQL in your Supabase SQL Editor

-- Add new question types to support subjective papers
ALTER TABLE exam_questions 
DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;

ALTER TABLE exam_questions 
ADD CONSTRAINT exam_questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'file_upload', 'subjective'));

-- Add new columns to exam_questions for file upload support
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_requirements JSONB DEFAULT NULL; -- {"allowed_types": ["pdf", "doc", "docx"], "max_size_mb": 10, "instructions": "Upload your answer sheet as PDF"}

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS word_limit INTEGER DEFAULT NULL; -- For essay questions

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS rich_text_enabled BOOLEAN DEFAULT FALSE; -- Allow rich text formatting

-- Create exam_answers table for storing student answers (including file uploads)
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

-- Create exam_grades table for manual grading
CREATE TABLE IF NOT EXISTS exam_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  points_awarded INTEGER DEFAULT 0,
  feedback TEXT, -- Teacher feedback
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exam_session_id, question_id) -- One grade per question per session
);

-- Add columns to exam_sessions for better tracking
ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS total_grade INTEGER DEFAULT NULL; -- Total points awarded after grading

ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS grading_status TEXT CHECK (grading_status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending';

-- Create storage bucket for exam files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for exam_answers
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Students can view and insert their own answers
CREATE POLICY "Students can view their own answers" ON exam_answers
  FOR SELECT USING (
    exam_session_id IN (
      SELECT id FROM exam_sessions 
      WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own answers" ON exam_answers
  FOR INSERT WITH CHECK (
    exam_session_id IN (
      SELECT id FROM exam_sessions 
      WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own answers" ON exam_answers
  FOR UPDATE USING (
    exam_session_id IN (
      SELECT id FROM exam_sessions 
      WHERE student_id = auth.uid()
    )
  );

-- Teachers and admins can view all answers
CREATE POLICY "Teachers can view all answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions es
      JOIN exams e ON es.exam_id = e.id
      JOIN courses c ON e.course_id = c.id
      WHERE es.id = exam_answers.exam_session_id
      AND (
        e.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
        )
      )
    )
  );

-- Create RLS policies for exam_grades
ALTER TABLE exam_grades ENABLE ROW LEVEL SECURITY;

-- Students can view their own grades
CREATE POLICY "Students can view their own grades" ON exam_grades
  FOR SELECT USING (
    exam_session_id IN (
      SELECT id FROM exam_sessions 
      WHERE student_id = auth.uid()
    )
  );

-- Teachers and admins can manage all grades
CREATE POLICY "Teachers can manage grades" ON exam_grades
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM exam_sessions es
      JOIN exams e ON es.exam_id = e.id
      WHERE es.id = exam_grades.exam_session_id
      AND (
        e.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
        )
      )
    )
  );

-- Create storage policies for exam files
CREATE POLICY "Students can upload exam files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exam-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'answers' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Students can view their own exam files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exam-files' AND
    auth.role() = 'authenticated' AND
    (
      (storage.foldername(name))[2] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM exam_answers ea
        JOIN exam_sessions es ON ea.exam_session_id = es.id
        JOIN exams e ON es.exam_id = e.id
        WHERE ea.file_path = name
        AND (
          e.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
          )
        )
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_answers_session_question ON exam_answers(exam_session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_submitted_at ON exam_answers(submitted_at);
CREATE INDEX IF NOT EXISTS idx_exam_grades_session_question ON exam_grades(exam_session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_exam_grades_graded_at ON exam_grades(graded_at);

-- Add function to calculate total grade for an exam session
CREATE OR REPLACE FUNCTION calculate_exam_session_grade(session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(points_awarded), 0)
  INTO total_points
  FROM exam_grades
  WHERE exam_session_id = session_id;
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update total grade when grades are updated
CREATE OR REPLACE FUNCTION update_exam_session_total_grade()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE exam_sessions
  SET total_grade = calculate_exam_session_grade(NEW.exam_session_id)
  WHERE id = NEW.exam_session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exam_session_grade
  AFTER INSERT OR UPDATE OR DELETE ON exam_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_session_total_grade();

-- Grant necessary permissions
GRANT ALL ON exam_answers TO authenticated;
GRANT ALL ON exam_grades TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;

-- Success message
SELECT 'Exam schema enhanced successfully for subjective papers and file uploads!' as message;
