-- Add Exam Tables to Vidyakosh LMS
-- Run this SQL in your Supabase SQL Editor

-- Exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL, -- Exam duration in minutes
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exam Questions table
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  options JSONB, -- For multiple choice questions: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer TEXT, -- For auto-graded questions
  points INTEGER DEFAULT 1,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exam Sessions table - tracks individual student exam attempts
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  auto_submitted BOOLEAN DEFAULT FALSE,
  time_remaining_seconds INTEGER, -- Track remaining time
  answers JSONB, -- Store student answers: {"question_id": "answer"}
  score INTEGER,
  total_points INTEGER,
  status TEXT CHECK (status IN ('in_progress', 'submitted', 'graded')) DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add unique constraint to prevent multiple sessions per student per exam
ALTER TABLE exam_sessions ADD CONSTRAINT unique_student_exam 
  UNIQUE (exam_id, student_id);

-- Enable Row Level Security
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams
CREATE POLICY "Users can view exams in their school courses" ON exams
  FOR SELECT USING (
    course_id IN (
      SELECT c.id FROM courses c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create exams in their courses" ON exams
  FOR INSERT WITH CHECK (
    course_id IN (
      SELECT ct.course_id FROM course_teachers ct
      WHERE ct.teacher_id = auth.uid()
    ) OR
    course_id IN (
      SELECT c.id FROM courses c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Teachers can update their exams" ON exams
  FOR UPDATE USING (
    created_by = auth.uid() OR
    course_id IN (
      SELECT c.id FROM courses c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for exam questions
CREATE POLICY "Users can view questions for accessible exams" ON exam_questions
  FOR SELECT USING (
    exam_id IN (
      SELECT e.id FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage questions for their exams" ON exam_questions
  FOR ALL USING (
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

-- RLS Policies for exam sessions
CREATE POLICY "Students can view their own exam sessions" ON exam_sessions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view exam sessions for their exams" ON exam_sessions
  FOR SELECT USING (
    exam_id IN (
      SELECT e.id FROM exams e
      WHERE e.created_by = auth.uid()
    ) OR
    exam_id IN (
      SELECT e.id FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Students can create and update their own exam sessions" ON exam_sessions
  FOR ALL USING (student_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_order ON exam_questions(exam_id, order_index);
CREATE INDEX idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_student_id ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);

-- Function to auto-submit exam when time expires
CREATE OR REPLACE FUNCTION auto_submit_expired_exams()
RETURNS void AS $$
BEGIN
  UPDATE exam_sessions 
  SET 
    submitted_at = now(),
    auto_submitted = TRUE,
    status = 'submitted'
  WHERE 
    status = 'in_progress' 
    AND started_at + INTERVAL '1 minute' * (
      SELECT duration_minutes FROM exams WHERE id = exam_sessions.exam_id
    ) <= now()
    AND submitted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate exam score
CREATE OR REPLACE FUNCTION calculate_exam_score(session_id UUID)
RETURNS void AS $$
DECLARE
  session_record exam_sessions%ROWTYPE;
  question_record exam_questions%ROWTYPE;
  student_answer TEXT;
  total_score INTEGER := 0;
  total_points INTEGER := 0;
BEGIN
  -- Get the exam session
  SELECT * INTO session_record FROM exam_sessions WHERE id = session_id;
  
  -- Calculate score for auto-gradable questions
  FOR question_record IN 
    SELECT * FROM exam_questions WHERE exam_id = session_record.exam_id
  LOOP
    total_points := total_points + COALESCE(question_record.points, 1);
    
    -- Get student's answer for this question
    student_answer := session_record.answers ->> question_record.id::TEXT;
    
    -- Check if answer is correct (for multiple choice and true/false)
    IF question_record.question_type IN ('multiple_choice', 'true_false') THEN
      IF student_answer = question_record.correct_answer THEN
        total_score := total_score + COALESCE(question_record.points, 1);
      END IF;
    END IF;
  END LOOP;
  
  -- Update the exam session with the score
  UPDATE exam_sessions 
  SET 
    score = total_score,
    total_points = total_points,
    status = CASE 
      WHEN EXISTS (
        SELECT 1 FROM exam_questions 
        WHERE exam_id = session_record.exam_id 
        AND question_type IN ('short_answer', 'essay')
      ) THEN 'submitted' -- Needs manual grading
      ELSE 'graded' -- Fully auto-graded
    END
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for exam sessions (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE exam_sessions;
