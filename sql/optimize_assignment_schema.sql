-- Optimize Assignment Schema for Wasabi File Uploads
-- Run this SQL in your Supabase SQL Editor

-- ========================================
-- 1. ENHANCE ASSIGNMENTS TABLE
-- ========================================

-- Add file-related columns to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS file_path TEXT DEFAULT NULL;

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT NULL;

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT NULL;

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT NULL;

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS file_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT NULL;

-- ========================================
-- 2. ENHANCE ASSIGNMENT SUBMISSIONS TABLE
-- ========================================

-- Ensure assignment_submissions table exists with all necessary columns
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  file_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  file_metadata JSONB DEFAULT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Add updated_at trigger for assignment_submissions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at
    BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. CREATE FILE MANAGEMENT INDEXES
-- ========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_file_path ON assignments(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_uploaded_at ON assignments(file_uploaded_at) WHERE file_uploaded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_file_path ON assignment_submissions(file_path) WHERE file_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_uploaded_at ON assignment_submissions(file_uploaded_at) WHERE file_uploaded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_student ON assignment_submissions(assignment_id, student_id);

-- ========================================
-- 4. OPTIMIZE RLS POLICIES FOR ASSIGNMENTS
-- ========================================

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers and admins can create assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can update assignments" ON assignments;
DROP POLICY IF EXISTS "Assignment creators and admins can delete assignments" ON assignments;

-- Create optimized policies for assignments
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

CREATE POLICY "Assignment creators and admins can update assignments" ON assignments
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

CREATE POLICY "Assignment creators and admins can delete assignments" ON assignments
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
-- 5. CREATE RLS POLICIES FOR ASSIGNMENT SUBMISSIONS
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can submit assignments" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Teachers and admins can view all submissions" ON assignment_submissions;

-- Create policies for assignment_submissions
CREATE POLICY "Students can view their own submissions" ON assignment_submissions
FOR SELECT USING (
  auth.role() = 'authenticated' AND student_id = auth.uid()
);

CREATE POLICY "Students can submit assignments" ON assignment_submissions
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM course_enrollments ce
    JOIN assignments a ON ce.course_id = a.course_id
    WHERE ce.student_id = auth.uid() 
    AND a.id = assignment_id
  )
);

CREATE POLICY "Students can update their own submissions" ON assignment_submissions
FOR UPDATE USING (
  auth.role() = 'authenticated' AND student_id = auth.uid()
);

CREATE POLICY "Teachers and admins can view all submissions" ON assignment_submissions
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = assignment_id
    AND (
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'teacher')
      )
    )
  )
);

-- ========================================
-- 6. CREATE ASSIGNMENT FILE CLEANUP FUNCTION
-- ========================================

-- Function to clean up orphaned assignment files
CREATE OR REPLACE FUNCTION cleanup_orphaned_assignment_files()
RETURNS TABLE(
  table_name TEXT,
  record_id UUID,
  file_path TEXT,
  file_name TEXT
) AS $$
BEGIN
  -- Find orphaned assignment files
  RETURN QUERY
  SELECT 
    'assignments'::TEXT as table_name,
    a.id as record_id,
    a.file_path,
    a.file_name
  FROM assignments a
  WHERE a.file_path IS NOT NULL
  AND a.file_uploaded_at < NOW() - INTERVAL '1 day' -- Only check files uploaded more than 1 day ago
  AND NOT EXISTS (
    SELECT 1 FROM assignment_submissions s 
    WHERE s.file_path = a.file_path
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. CREATE ASSIGNMENT FILE STATISTICS VIEW
-- ========================================

-- View for assignment file upload statistics
CREATE OR REPLACE VIEW assignment_file_stats AS
SELECT 
  'assignments' as file_type,
  COUNT(*) as total_files,
  COUNT(file_path) as files_with_uploads,
  SUM(file_size) as total_size_bytes,
  AVG(file_size) as average_size_bytes,
  MAX(file_uploaded_at) as latest_upload
FROM assignments
UNION ALL
SELECT 
  'assignment_submissions' as file_type,
  COUNT(*) as total_files,
  COUNT(file_path) as files_with_uploads,
  SUM(file_size) as total_size_bytes,
  AVG(file_size) as average_size_bytes,
  MAX(file_uploaded_at) as latest_upload
FROM assignment_submissions;

-- ========================================
-- 8. CREATE ASSIGNMENT SUBMISSION TRACKING VIEW
-- ========================================

-- View for tracking assignment submissions
CREATE OR REPLACE VIEW assignment_submission_summary AS
SELECT 
  a.id as assignment_id,
  a.title as assignment_title,
  c.title as course_title,
  COUNT(s.id) as total_submissions,
  COUNT(s.file_path) as submissions_with_files,
  AVG(s.file_size) as average_submission_size,
  MAX(s.submitted_at) as latest_submission
FROM assignments a
JOIN courses c ON a.course_id = c.id
LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
GROUP BY a.id, a.title, c.title
ORDER BY a.created_at DESC;

-- ========================================
-- 9. VERIFY SETUP
-- ========================================

-- Check assignments table structure
SELECT 
  'assignments' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'assignments'
AND column_name IN ('file_path', 'file_name', 'file_size', 'mime_type', 'file_uploaded_at', 'file_metadata')
ORDER BY ordinal_position;

-- Check assignment_submissions structure
SELECT 
  'assignment_submissions' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'assignment_submissions'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('assignments', 'assignment_submissions')
AND indexname LIKE '%file%'
ORDER BY tablename, indexname;

-- Check policies
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

-- Show file statistics
SELECT * FROM assignment_file_stats;

-- Show submission summary
SELECT * FROM assignment_submission_summary LIMIT 10;
