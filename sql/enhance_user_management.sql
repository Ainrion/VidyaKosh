-- Enhanced User Management System for Vidyakosh LMS
-- Run this SQL in your Supabase SQL Editor

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

-- Create user_institutions table for multi-institutional enrollment
CREATE TABLE IF NOT EXISTS user_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending', 'suspended')) DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, institution_id)
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

-- Update courses table to reference institutions instead of schools
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;

-- Create content_types table for different content formats
CREATE TABLE IF NOT EXISTS content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  file_extension TEXT,
  is_supported BOOLEAN DEFAULT TRUE,
  max_size_mb INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default content types
INSERT INTO content_types (name, mime_type, file_extension, max_size_mb) VALUES
('PDF Document', 'application/pdf', '.pdf', 50),
('Video MP4', 'video/mp4', '.mp4', 500),
('Video WebM', 'video/webm', '.webm', 500),
('Audio MP3', 'audio/mp3', '.mp3', 100),
('Audio WAV', 'audio/wav', '.wav', 100),
('PowerPoint', 'application/vnd.ms-powerpoint', '.ppt', 50),
('PowerPoint Modern', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx', 50),
('Word Document', 'application/msword', '.doc', 50),
('Word Document Modern', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx', 50),
('Excel Spreadsheet', 'application/vnd.ms-excel', '.xls', 50),
('Excel Spreadsheet Modern', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx', 50),
('Text File', 'text/plain', '.txt', 10),
('Image JPEG', 'image/jpeg', '.jpg', 20),
('Image PNG', 'image/png', '.png', 20),
('Image GIF', 'image/gif', '.gif', 20),
('Code Archive', 'application/zip', '.zip', 100)
ON CONFLICT (name) DO NOTHING;

-- Create subjects table for content tagging
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default subjects
INSERT INTO subjects (name, code, description, color) VALUES
('Mathematics', 'MATH', 'Mathematical concepts and problem solving', '#EF4444'),
('Science', 'SCI', 'General science including physics, chemistry, biology', '#10B981'),
('English', 'ENG', 'English language and literature', '#3B82F6'),
('History', 'HIST', 'Historical events and analysis', '#F59E0B'),
('Geography', 'GEO', 'Geographical concepts and world knowledge', '#8B5CF6'),
('Computer Science', 'CS', 'Programming and computer concepts', '#06B6D4'),
('Physics', 'PHY', 'Physical sciences and laws', '#84CC16'),
('Chemistry', 'CHEM', 'Chemical reactions and properties', '#F97316'),
('Biology', 'BIO', 'Life sciences and living organisms', '#22C55E'),
('Art', 'ART', 'Visual arts and creativity', '#EC4899'),
('Music', 'MUS', 'Musical theory and practice', '#A855F7'),
('Physical Education', 'PE', 'Physical fitness and sports', '#14B8A6')
ON CONFLICT (code) DO NOTHING;

-- Create grades table for content tagging
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  age_range TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default grades
INSERT INTO grades (name, level, description, age_range) VALUES
('Kindergarten', 0, 'Early childhood education', '4-5 years'),
('Grade 1', 1, 'First grade elementary', '6-7 years'),
('Grade 2', 2, 'Second grade elementary', '7-8 years'),
('Grade 3', 3, 'Third grade elementary', '8-9 years'),
('Grade 4', 4, 'Fourth grade elementary', '9-10 years'),
('Grade 5', 5, 'Fifth grade elementary', '10-11 years'),
('Grade 6', 6, 'Sixth grade middle school', '11-12 years'),
('Grade 7', 7, 'Seventh grade middle school', '12-13 years'),
('Grade 8', 8, 'Eighth grade middle school', '13-14 years'),
('Grade 9', 9, 'Ninth grade high school', '14-15 years'),
('Grade 10', 10, 'Tenth grade high school', '15-16 years'),
('Grade 11', 11, 'Eleventh grade high school', '16-17 years'),
('Grade 12', 12, 'Twelfth grade high school', '17-18 years'),
('Undergraduate', 13, 'College/University undergraduate', '18+ years'),
('Graduate', 14, 'Graduate studies', '21+ years'),
('Professional', 15, 'Professional development', 'All ages')
ON CONFLICT (name) DO NOTHING;

-- Create topics table for content tagging
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create micro_learning_modules table
CREATE TABLE IF NOT EXISTS micro_learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'interactive', 'quiz', 'assignment')),
  duration_minutes INTEGER DEFAULT 5,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create module_content table for storing actual content
CREATE TABLE IF NOT EXISTS module_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES micro_learning_modules(id) ON DELETE CASCADE,
  content_type_id UUID REFERENCES content_types(id),
  title TEXT NOT NULL,
  content_url TEXT,
  content_text TEXT,
  file_path TEXT,
  file_size INTEGER,
  duration_seconds INTEGER,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_tags table for tagging system
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'module', 'assignment', 'quiz')),
  content_id UUID NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(content_type, content_id, subject_id, grade_id, topic_id)
);

-- Create coding_questions table for enhanced quiz builder
CREATE TABLE IF NOT EXISTS coding_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('javascript', 'python', 'java', 'cpp', 'c', 'sql', 'html', 'css')),
  starter_code TEXT,
  solution_code TEXT,
  test_cases JSONB DEFAULT '[]',
  points INTEGER DEFAULT 1,
  time_limit_seconds INTEGER DEFAULT 300,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create performance_analytics table
CREATE TABLE IF NOT EXISTS performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('course', 'lesson', 'quiz', 'assignment', 'exam')),
  content_id UUID NOT NULL,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  time_spent_seconds INTEGER,
  attempts INTEGER DEFAULT 1,
  completion_percentage DECIMAL(5,2),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assignment_due', 'exam_scheduled', 'grade_posted', 'announcement', 'message', 'course_update')),
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, title_template, body_template) VALUES
('Assignment Due', 'assignment_due', 'Assignment Due: {{assignment_title}}', 'Your assignment "{{assignment_title}}" is due on {{due_date}}. Don''t forget to submit it!'),
('Exam Scheduled', 'exam_scheduled', 'Exam Scheduled: {{exam_title}}', 'An exam "{{exam_title}}" has been scheduled for {{exam_date}}. Make sure you''re prepared!'),
('Grade Posted', 'grade_posted', 'Grade Posted: {{assignment_title}}', 'Your grade for "{{assignment_title}}" has been posted. You scored {{score}}/{{total_points}} points.'),
('New Announcement', 'announcement', 'New Announcement: {{announcement_title}}', '{{announcement_content}}'),
('New Message', 'message', 'New Message from {{sender_name}}', '{{message_content}}'),
('Course Update', 'course_update', 'Course Updated: {{course_title}}', 'The course "{{course_title}}" has been updated with new content.')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for institutions
CREATE POLICY "Users can view their institutions" ON institutions
  FOR SELECT USING (
    id IN (
      SELECT institution_id FROM user_institutions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage institutions" ON institutions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_institutions ui
      WHERE ui.user_id = auth.uid() 
      AND ui.institution_id = institutions.id 
      AND ui.role = 'admin'
    )
  );

-- Create RLS policies for user_institutions
CREATE POLICY "Users can view their institution memberships" ON user_institutions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Institution admins can view all memberships" ON user_institutions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_institutions ui
      WHERE ui.user_id = auth.uid() 
      AND ui.institution_id = user_institutions.institution_id 
      AND ui.role = 'admin'
    )
  );

-- Create RLS policies for parent_student_relationships
CREATE POLICY "Parents can view their relationships" ON parent_student_relationships
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Students can view their parent relationships" ON parent_student_relationships
  FOR SELECT USING (student_id = auth.uid());

-- Create RLS policies for content management
CREATE POLICY "Users can view content types" ON content_types
  FOR SELECT USING (is_supported = true);

CREATE POLICY "Users can view subjects" ON subjects
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view grades" ON grades
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view topics" ON topics
  FOR SELECT USING (is_active = true);

-- Create RLS policies for micro learning modules
CREATE POLICY "Users can view published modules" ON micro_learning_modules
  FOR SELECT USING (is_published = true);

CREATE POLICY "Teachers can manage their modules" ON micro_learning_modules
  FOR ALL USING (created_by = auth.uid());

-- Create RLS policies for performance analytics
CREATE POLICY "Users can view their own analytics" ON performance_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can view student analytics" ON performance_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      JOIN course_teachers ct ON c.id = ct.course_id
      WHERE ct.teacher_id = auth.uid()
      AND c.id = performance_analytics.content_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_institutions_user_id ON user_institutions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_institutions_institution_id ON user_institutions(institution_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_parent_id ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student_id ON parent_student_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_content ON content_tags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_user ON performance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_content ON performance_analytics(content_type, content_id);

-- Create functions for analytics
CREATE OR REPLACE FUNCTION get_user_performance_summary(user_uuid UUID, institution_uuid UUID)
RETURNS TABLE (
  total_courses INTEGER,
  completed_courses INTEGER,
  average_score DECIMAL,
  total_time_spent INTEGER,
  recent_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pa.content_id)::INTEGER as total_courses,
    COUNT(DISTINCT CASE WHEN pa.completion_percentage = 100 THEN pa.content_id END)::INTEGER as completed_courses,
    AVG(pa.score) as average_score,
    SUM(pa.time_spent_seconds)::INTEGER as total_time_spent,
    MAX(pa.last_accessed) as recent_activity
  FROM performance_analytics pa
  WHERE pa.user_id = user_uuid 
  AND pa.institution_id = institution_uuid
  AND pa.content_type = 'course';
END;
$$ LANGUAGE plpgsql;

-- Create function to get course completion tracking
CREATE OR REPLACE FUNCTION get_course_completion_tracking(course_uuid UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  completion_percentage DECIMAL,
  last_accessed TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name as student_name,
    pa.completion_percentage,
    pa.last_accessed,
    pa.time_spent_seconds as total_time_spent
  FROM profiles p
  JOIN performance_analytics pa ON p.id = pa.user_id
  WHERE pa.content_id = course_uuid
  AND pa.content_type = 'course'
  ORDER BY pa.completion_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Enhanced user management system implemented successfully!' as message;
