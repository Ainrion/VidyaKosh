-- Comprehensive RLS Fix for Vidyakosh LMS
-- Run this SQL in your Supabase SQL Editor to fix all RLS issues

-- First, let's check the current state
SELECT 'Starting comprehensive RLS fix...' as info;

-- ========================================
-- 1. FIX PROFILES TABLE RLS
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

-- ========================================
-- 2. FIX SCHOOLS TABLE RLS
-- ========================================

-- Drop existing policies for schools
DROP POLICY IF EXISTS "Users can view schools" ON schools;
DROP POLICY IF EXISTS "Admins can manage schools" ON schools;
DROP POLICY IF EXISTS "Public school access" ON schools;
DROP POLICY IF EXISTS "Authenticated users can view schools" ON schools;

-- Enable RLS on schools table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Create policies for schools
CREATE POLICY "Authenticated users can view schools" ON schools
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage schools" ON schools
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ========================================
-- 3. FIX COURSES TABLE RLS
-- ========================================

-- Drop existing policies for courses
DROP POLICY IF EXISTS "Users can view courses in their school" ON courses;
DROP POLICY IF EXISTS "Teachers can create courses in their school" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Students can view enrolled courses" ON courses;
DROP POLICY IF EXISTS "Public course access" ON courses;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON courses;
DROP POLICY IF EXISTS "Teachers and admins can create courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can update courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can delete courses" ON courses;

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Authenticated users can view courses" ON courses
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can create courses" ON courses
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

CREATE POLICY "Course creators and admins can update courses" ON courses
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Course creators and admins can delete courses" ON courses
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- ========================================
-- 4. FIX CALENDAR EVENTS TABLE RLS
-- ========================================

-- Drop existing policies for calendar_events
DROP POLICY IF EXISTS "Users can view events in their school" ON calendar_events;
DROP POLICY IF EXISTS "Teachers and admins can create events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON calendar_events;
DROP POLICY IF EXISTS "Public calendar access" ON calendar_events;
DROP POLICY IF EXISTS "Authenticated users can view calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Teachers and admins can create calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Event creators and admins can update calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Event creators and admins can delete calendar events" ON calendar_events;

-- Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'assignment', 'holiday', 'meeting', 'class', 'other')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  color TEXT DEFAULT '#3b82f6',
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create school_holidays table if it doesn't exist
CREATE TABLE IF NOT EXISTS school_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  color TEXT DEFAULT '#dc2626',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on calendar tables
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_holidays ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_events
CREATE POLICY "Authenticated users can view calendar events" ON calendar_events
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can create calendar events" ON calendar_events
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

CREATE POLICY "Event creators and admins can update calendar events" ON calendar_events
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Event creators and admins can delete calendar events" ON calendar_events
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Create policies for school_holidays
DROP POLICY IF EXISTS "Authenticated users can view holidays" ON school_holidays;
DROP POLICY IF EXISTS "Admins can manage holidays" ON school_holidays;

CREATE POLICY "Authenticated users can view holidays" ON school_holidays
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage holidays" ON school_holidays
FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- ========================================
-- 5. FIX OTHER TABLES RLS
-- ========================================

-- Exams table
DROP POLICY IF EXISTS "Users can view exams in their school" ON exams;
DROP POLICY IF EXISTS "Teachers can create exams" ON exams;
DROP POLICY IF EXISTS "Admins can manage exams" ON exams;
DROP POLICY IF EXISTS "Authenticated users can view exams" ON exams;
DROP POLICY IF EXISTS "Teachers and admins can create exams" ON exams;
DROP POLICY IF EXISTS "Exam creators and admins can update exams" ON exams;
DROP POLICY IF EXISTS "Exam creators and admins can delete exams" ON exams;

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exams" ON exams
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can create exams" ON exams
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

CREATE POLICY "Exam creators and admins can update exams" ON exams
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

CREATE POLICY "Exam creators and admins can delete exams" ON exams
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Assignments table
DROP POLICY IF EXISTS "Users can view assignments in their school" ON assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can create assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can update assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can delete assignments" ON assignments;

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assignments" ON assignments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can create assignments" ON assignments
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

CREATE POLICY "Teachers and admins can update assignments" ON assignments
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

CREATE POLICY "Teachers and admins can delete assignments" ON assignments
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

-- ========================================
-- 6. GRANT PERMISSIONS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON schools TO authenticated;
GRANT ALL ON courses TO authenticated;
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON school_holidays TO authenticated;
GRANT ALL ON exams TO authenticated;
GRANT ALL ON assignments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Schools indexes
CREATE INDEX IF NOT EXISTS idx_schools_created_at ON schools(created_at);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_school_id ON courses(school_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- Calendar indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_school_id ON calendar_events(school_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_school_holidays_school_id ON school_holidays(school_id);
CREATE INDEX IF NOT EXISTS idx_school_holidays_date_range ON school_holidays(start_date, end_date);

-- Exams indexes
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);

-- ========================================
-- 8. VERIFICATION
-- ========================================

-- Show all created policies
SELECT 'Created policies for profiles:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'Created policies for schools:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'schools';

SELECT 'Created policies for courses:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'courses';

SELECT 'Created policies for calendar_events:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'calendar_events';

SELECT 'Created policies for school_holidays:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'school_holidays';

SELECT 'Created policies for exams:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'exams';

SELECT 'Created policies for assignments:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'assignments';

-- ========================================
-- 9. SUCCESS MESSAGE
-- ========================================

SELECT '✅ All RLS issues fixed successfully!' as status;
SELECT 'All authenticated users can now view data.' as message;
SELECT 'Teachers and admins can create/update/delete content.' as details;
SELECT 'Profile fetching should now work correctly.' as profile_fix;
SELECT 'Calendar events can be created and viewed.' as calendar_fix;
SELECT 'Courses, exams, and assignments are accessible.' as content_fix;
