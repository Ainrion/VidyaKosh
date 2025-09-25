-- Fixed Multi-Tenant Schema Update for School Isolation
-- This version works with your existing database structure (enrollments table, not course_enrollments)
-- Run this SQL in your Supabase SQL Editor

-- ========================================
-- 1. ENSURE SCHOOL_ID COLUMNS EXIST
-- ========================================

-- Add school_id to exams table if not exists
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to exam_questions table if not exists
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to exam_sessions table if not exists
ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to exam_answers table if not exists
ALTER TABLE exam_answers 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to assignments table if not exists
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Add school_id to assignment_submissions table if not exists
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- ========================================
-- 2. CREATE MULTI-TENANT INDEXES
-- ========================================

-- Create indexes for better performance with school-based queries
CREATE INDEX IF NOT EXISTS idx_exams_school_id ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_school_id ON exam_questions(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_school_id ON exam_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_school_id ON exam_answers(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_school_id ON assignment_submissions(school_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_exams_school_created_by ON exams(school_id, created_by);
CREATE INDEX IF NOT EXISTS idx_exam_questions_school_exam ON exam_questions(school_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_school_student ON exam_sessions(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_course ON assignments(school_id, course_id);

-- ========================================
-- 3. UPDATE RLS POLICIES FOR MULTI-TENANT
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can create assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can update assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can delete assignments" ON assignments;

DROP POLICY IF EXISTS "Students can view their own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can submit assignments" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Teachers and admins can view all submissions" ON assignment_submissions;

-- ========================================
-- 4. CREATE SCHOOL-ISOLATED RLS POLICIES
-- ========================================

-- Assignments: School-isolated policies
CREATE POLICY "Users can view assignments from their school" ON assignments
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Teachers and admins can create assignments in their school" ON assignments
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
    AND profiles.school_id = assignments.school_id
  )
);

CREATE POLICY "Assignment creators and admins can update assignments in their school" ON assignments
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ) AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.school_id = assignments.school_id
    )
  )
);

CREATE POLICY "Assignment creators and admins can delete assignments in their school" ON assignments
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ) AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
      AND profiles.school_id = assignments.school_id
    )
  )
);

-- Assignment Submissions: School-isolated policies (using enrollments table)
CREATE POLICY "Students can view their own submissions from their school" ON assignment_submissions
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ) AND student_id = auth.uid()
);

CREATE POLICY "Students can submit assignments in their school" ON assignment_submissions
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ) AND
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = auth.uid() 
    AND c.school_id = assignment_submissions.school_id
    AND c.id IN (
      SELECT course_id FROM assignments 
      WHERE id = assignment_submissions.assignment_id
    )
  )
);

CREATE POLICY "Students can update their own submissions in their school" ON assignment_submissions
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ) AND student_id = auth.uid()
);

CREATE POLICY "Teachers and admins can view submissions in their school" ON assignment_submissions
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = assignment_submissions.assignment_id
    AND c.school_id = assignment_submissions.school_id
    AND (
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher')
        AND profiles.school_id = assignment_submissions.school_id
      )
    )
  )
);

-- ========================================
-- 5. CREATE SCHOOL DATA MIGRATION FUNCTIONS
-- ========================================

-- Function to populate school_id for existing records
CREATE OR REPLACE FUNCTION populate_school_ids()
RETURNS TABLE(
  table_name TEXT,
  updated_count INTEGER
) AS $$
BEGIN
  -- Update exams with school_id from courses
  UPDATE exams 
  SET school_id = c.school_id
  FROM courses c
  WHERE exams.course_id = c.id 
  AND exams.school_id IS NULL;
  
  RETURN QUERY SELECT 'exams', COUNT(*)::INTEGER FROM exams WHERE school_id IS NOT NULL;

  -- Update exam_questions with school_id from exams
  UPDATE exam_questions 
  SET school_id = e.school_id
  FROM exams e
  WHERE exam_questions.exam_id = e.id 
  AND exam_questions.school_id IS NULL;
  
  RETURN QUERY SELECT 'exam_questions', COUNT(*)::INTEGER FROM exam_questions WHERE school_id IS NOT NULL;

  -- Update exam_sessions with school_id from exams
  UPDATE exam_sessions 
  SET school_id = e.school_id
  FROM exams e
  WHERE exam_sessions.exam_id = e.id 
  AND exam_sessions.school_id IS NULL;
  
  RETURN QUERY SELECT 'exam_sessions', COUNT(*)::INTEGER FROM exam_sessions WHERE school_id IS NOT NULL;

  -- Update exam_answers with school_id from exam_sessions
  UPDATE exam_answers 
  SET school_id = es.school_id
  FROM exam_sessions es
  WHERE exam_answers.exam_session_id = es.id 
  AND exam_answers.school_id IS NULL;
  
  RETURN QUERY SELECT 'exam_answers', COUNT(*)::INTEGER FROM exam_answers WHERE school_id IS NOT NULL;

  -- Update assignments with school_id from courses
  UPDATE assignments 
  SET school_id = c.school_id
  FROM courses c
  WHERE assignments.course_id = c.id 
  AND assignments.school_id IS NULL;
  
  RETURN QUERY SELECT 'assignments', COUNT(*)::INTEGER FROM assignments WHERE school_id IS NOT NULL;

  -- Update assignment_submissions with school_id from assignments
  UPDATE assignment_submissions 
  SET school_id = a.school_id
  FROM assignments a
  WHERE assignment_submissions.assignment_id = a.id 
  AND assignment_submissions.school_id IS NULL;
  
  RETURN QUERY SELECT 'assignment_submissions', COUNT(*)::INTEGER FROM assignment_submissions WHERE school_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. CREATE SCHOOL ISOLATION VALIDATION
-- ========================================

-- Function to validate school isolation
CREATE OR REPLACE FUNCTION validate_school_isolation()
RETURNS TABLE(
  table_name TEXT,
  violation_count INTEGER,
  violation_details TEXT
) AS $$
BEGIN
  -- Check for exams without proper school isolation
  RETURN QUERY
  SELECT 
    'exams'::TEXT,
    COUNT(*)::INTEGER,
    'Exams without school_id'::TEXT
  FROM exams 
  WHERE school_id IS NULL;

  -- Check for exam_questions without proper school isolation
  RETURN QUERY
  SELECT 
    'exam_questions'::TEXT,
    COUNT(*)::INTEGER,
    'Exam questions without school_id'::TEXT
  FROM exam_questions 
  WHERE school_id IS NULL;

  -- Check for cross-school violations
  RETURN QUERY
  SELECT 
    'exam_questions_cross_school'::TEXT,
    COUNT(*)::INTEGER,
    'Exam questions with mismatched school_id'::TEXT
  FROM exam_questions eq
  JOIN exams e ON eq.exam_id = e.id
  WHERE eq.school_id != e.school_id;

  -- Check for assignments without proper school isolation
  RETURN QUERY
  SELECT 
    'assignments'::TEXT,
    COUNT(*)::INTEGER,
    'Assignments without school_id'::TEXT
  FROM assignments 
  WHERE school_id IS NULL;

  -- Check for assignment cross-school violations
  RETURN QUERY
  SELECT 
    'assignments_cross_school'::TEXT,
    COUNT(*)::INTEGER,
    'Assignments with mismatched school_id'::TEXT
  FROM assignments a
  JOIN courses c ON a.course_id = c.id
  WHERE a.school_id != c.school_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. CREATE SCHOOL FILE CLEANUP FUNCTION
-- ========================================

-- Function to clean up files for a specific school
CREATE OR REPLACE FUNCTION cleanup_school_files(target_school_id UUID)
RETURNS TABLE(
  file_type TEXT,
  file_path TEXT,
  file_size INTEGER
) AS $$
BEGIN
  -- Get all file paths for the school
  RETURN QUERY
  SELECT 
    'exam_questions'::TEXT,
    eq.file_path,
    eq.file_size
  FROM exam_questions eq
  WHERE eq.school_id = target_school_id
  AND eq.file_path IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'exam_answers'::TEXT,
    ea.file_path,
    ea.file_size
  FROM exam_answers ea
  WHERE ea.school_id = target_school_id
  AND ea.file_path IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'assignments'::TEXT,
    a.file_path,
    a.file_size
  FROM assignments a
  WHERE a.school_id = target_school_id
  AND a.file_path IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'assignment_submissions'::TEXT,
    asub.file_path,
    asub.file_size
  FROM assignment_submissions asub
  WHERE asub.school_id = target_school_id
  AND asub.file_path IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. RUN MIGRATION AND VALIDATION
-- ========================================

-- Populate school IDs for existing records
SELECT * FROM populate_school_ids();

-- Validate school isolation
SELECT * FROM validate_school_isolation();

-- ========================================
-- 9. VERIFY SETUP
-- ========================================

-- Check table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('exams', 'exam_questions', 'exam_sessions', 'exam_answers', 'assignments', 'assignment_submissions')
AND column_name = 'school_id'
ORDER BY table_name;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('exams', 'exam_questions', 'exam_sessions', 'exam_answers', 'assignments', 'assignment_submissions')
AND indexname LIKE '%school%'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('assignments', 'assignment_submissions')
ORDER BY tablename, policyname;
