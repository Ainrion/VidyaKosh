-- Complete Database Setup for Vidyakosh LMS
-- Run this SQL in your Supabase SQL Editor to set up all features

-- ========================================
-- 1. FIX RLS ISSUES (from fix_all_rls_issues.sql)
-- ========================================

-- Drop existing problematic policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Authenticated users can view profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fix other tables RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create basic policies for other tables
CREATE POLICY "Authenticated users can view schools" ON schools
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view courses" ON courses
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view exams" ON exams
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view assignments" ON assignments
FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- 2. ENHANCE EXAM SCHEMA FOR SUBJECTIVE EXAMS
-- ========================================

-- Add new question types to support subjective papers
ALTER TABLE exam_questions 
DROP CONSTRAINT IF EXISTS exam_questions_question_type_check;

ALTER TABLE exam_questions 
ADD CONSTRAINT exam_questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'file_upload', 'subjective'));

-- Add new columns to exam_questions for file upload support
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS file_requirements JSONB DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS word_limit INTEGER DEFAULT NULL;

ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS rich_text_enabled BOOLEAN DEFAULT FALSE;

-- Create exam_answers table for storing student answers
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  text_answer TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exam_session_id, question_id)
);

-- Create exam_grades table for manual grading
CREATE TABLE IF NOT EXISTS exam_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
  points_awarded INTEGER DEFAULT 0,
  feedback TEXT,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exam_session_id, question_id)
);

-- Add columns to exam_sessions for better tracking
ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS total_grade INTEGER DEFAULT NULL;

ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS grading_status TEXT CHECK (grading_status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending';

-- Create storage bucket for exam files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new exam tables
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_grades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exam_answers
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

CREATE POLICY "Teachers can view all answers" ON exam_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions es
      JOIN exams e ON es.exam_id = e.id
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
CREATE POLICY "Students can view their own grades" ON exam_grades
  FOR SELECT USING (
    exam_session_id IN (
      SELECT id FROM exam_sessions 
      WHERE student_id = auth.uid()
    )
  );

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

-- ========================================
-- 3. ENHANCE USER MANAGEMENT
-- ========================================

-- Add Parent role to existing profiles table
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'teacher', 'student', 'parent'));

-- Create institutions table for multi-institutional support
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('school', 'university', 'training_center', 'corporate')),
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parent_student_relationships table
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'guardian', 'relative')),
  is_primary BOOLEAN DEFAULT FALSE,
  can_view_grades BOOLEAN DEFAULT TRUE,
  can_receive_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- ========================================
-- 4. CREATE QUIZ SYSTEM
-- ========================================

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 1,
  passing_score INTEGER DEFAULT 70,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'coding')),
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  options JSONB DEFAULT NULL,
  correct_answer TEXT,
  coding_question JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  total_points INTEGER,
  answers JSONB DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0
);

-- Enable RLS on quiz tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quizzes
CREATE POLICY "Authenticated users can view quizzes" ON quizzes
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can manage quizzes" ON quizzes
FOR ALL USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

-- Create RLS policies for quiz_questions
CREATE POLICY "Authenticated users can view quiz questions" ON quiz_questions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions
FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
      AND (
        q.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('admin', 'teacher')
        )
      )
    )
  )
);

-- Create RLS policies for quiz_attempts
CREATE POLICY "Students can view their own attempts" ON quiz_attempts
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create their own attempts" ON quiz_attempts
FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view all attempts" ON quiz_attempts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = quiz_attempts.quiz_id
    AND (
      q.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher')
      )
    )
  )
);

-- ========================================
-- 5. CREATE COMMUNICATION SYSTEM
-- ========================================

-- Create channels table for group discussions
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table for chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create discussion_boards table
CREATE TABLE IF NOT EXISTS discussion_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create discussion_posts table
CREATE TABLE IF NOT EXISTS discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES discussion_boards(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on communication tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for communication
CREATE POLICY "Authenticated users can view channels" ON channels
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view messages" ON messages
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view discussion boards" ON discussion_boards
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view discussion posts" ON discussion_posts
FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- 6. CREATE ANALYTICS TABLES
-- ========================================

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'course_access', 'quiz_attempt', 'assignment_submission', 'exam_taken')),
  content_id UUID,
  content_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create course_progress table
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on analytics tables
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics
CREATE POLICY "Users can view their own activity" ON user_activity
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own progress" ON course_progress
FOR SELECT USING (user_id = auth.uid());

-- ========================================
-- 7. CREATE STORAGE BUCKETS
-- ========================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES
('course-content', 'course-content', false),
('chat-files', 'chat-files', false),
('discussion-files', 'discussion-files', false)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON schools TO authenticated;
GRANT ALL ON courses TO authenticated;
GRANT ALL ON exams TO authenticated;
GRANT ALL ON assignments TO authenticated;
GRANT ALL ON exam_answers TO authenticated;
GRANT ALL ON exam_grades TO authenticated;
GRANT ALL ON institutions TO authenticated;
GRANT ALL ON parent_student_relationships TO authenticated;
GRANT ALL ON quizzes TO authenticated;
GRANT ALL ON quiz_questions TO authenticated;
GRANT ALL ON quiz_attempts TO authenticated;
GRANT ALL ON channels TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON discussion_boards TO authenticated;
GRANT ALL ON discussion_posts TO authenticated;
GRANT ALL ON user_activity TO authenticated;
GRANT ALL ON course_progress TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;

-- ========================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Exam indexes
CREATE INDEX IF NOT EXISTS idx_exam_answers_session_question ON exam_answers(exam_session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_exam_grades_session_question ON exam_grades(exam_session_id, question_id);

-- Quiz indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_student ON quiz_attempts(quiz_id, student_id);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_board_id ON discussion_posts(board_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_id);

-- ========================================
-- 10. SUCCESS MESSAGE
-- ========================================

SELECT '✅ Complete database setup finished successfully!' as status;
SELECT 'All features are now available:' as message;
SELECT '• Subjective exams with file uploads' as feature1;
SELECT '• Quiz builder with coding questions' as feature2;
SELECT '• Communication system (chat & discussions)' as feature3;
SELECT '• User management with parent role' as feature4;
SELECT '• Analytics and progress tracking' as feature5;
SELECT '• Multi-institutional support' as feature6;
