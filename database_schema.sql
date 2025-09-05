-- Vidyakosh LMS Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
-- This is important for multi-tenant security

-- School table (multi-tenant root entity)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Profiles linked to Supabase Auth's "auth.users"
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- Should match auth.users.id
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Courses (belongs to school, has teachers)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  archived BOOLEAN DEFAULT FALSE
);

-- Course Teachers (Many-to-many)
CREATE TABLE course_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enrollment (students in courses)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assignment Submissions
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  submission_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  grade INTEGER,
  feedback TEXT
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz Questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT,
  options JSONB,
  correct_answer TEXT,
  order_index INTEGER
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score INTEGER,
  answers JSONB
);

-- Real-Time Blackboard/Whiteboard
CREATE TABLE blackboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT,
  board_state JSONB, -- Store strokes, elements, etc.
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Channels can be course-based, group, or direct/private
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  name TEXT,
  is_private BOOLEAN DEFAULT FALSE
);

-- Channel Members (for group-private/direct)
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  attachment_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  link_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- File Storage Reference
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES profiles(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  size_in_bytes BIGINT,
  is_assignment_submission BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Engagement Metrics (aggregated or per action)
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  school_id UUID REFERENCES schools(id),
  type TEXT NOT NULL, -- e.g., 'login', 'view_lesson', 'submit_assignment'
  meta JSONB,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Attendance (digital roll-call)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id),
  user_id UUID REFERENCES profiles(id),
  attended_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Track background jobs (media processing, pdf gen, etc)
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- e.g., 'media_process', 'report_generation'
  payload JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  error TEXT
);

-- Subscription/Billing (optional, can connect to Stripe/other CC later)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  price_cents INTEGER,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- Enable Row Level Security (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can see profiles in their school
CREATE POLICY "Users can view school profiles" ON profiles
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- School data access
CREATE POLICY "Users can view their school" ON schools
  FOR SELECT USING (
    id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Course access based on school
CREATE POLICY "School users can view courses" ON courses
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and teachers can create courses" ON courses
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Messages access
CREATE POLICY "Users can view messages in their channels" ON messages
  FOR SELECT USING (
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid()
    )
  );

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

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: This function would need to be customized based on how you handle school assignment
  -- For now, it just ensures the profile exists
  INSERT INTO public.profiles (id, email, full_name, role, school_id)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'student', NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Indexes for performance
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_courses_school_id ON courses(school_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_order ON exam_questions(exam_id, order_index);
CREATE INDEX idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_student_id ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE exam_sessions;
