-- Complete Student Enrollment System Fix
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. CREATE MISSING ENROLLMENT TABLES
-- ========================================

-- Create course enrollment codes table (Discord-style codes)
CREATE TABLE IF NOT EXISTS course_enrollment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create enrollment code usage tracking table
CREATE TABLE IF NOT EXISTS enrollment_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES course_enrollment_codes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code_id, student_id) -- Prevent duplicate usage
);

-- Add enrollment tracking columns to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS enrollment_method TEXT DEFAULT 'manual' CHECK (enrollment_method IN ('manual', 'code', 'bulk', 'invitation')),
ADD COLUMN IF NOT EXISTS enrollment_code_id UUID REFERENCES course_enrollment_codes(id),
ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_course_id ON course_enrollment_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_code ON course_enrollment_codes(code);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_created_by ON course_enrollment_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_active ON course_enrollment_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollment_code_usage_code_id ON enrollment_code_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_code_usage_student_id ON enrollment_code_usage(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_method ON enrollments(enrollment_method);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- ========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE course_enrollment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_code_usage ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CREATE RLS POLICIES FOR COURSE ENROLLMENT CODES
-- ========================================

-- Teachers can view codes for their courses
CREATE POLICY "Teachers can view own course codes" ON course_enrollment_codes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Admins can view codes for school courses
CREATE POLICY "Admins can view school course codes" ON course_enrollment_codes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    JOIN profiles ON profiles.id = auth.uid()
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.school_id = profiles.school_id
    AND profiles.role = 'admin'
  )
);

-- Students can view active codes (for validation)
CREATE POLICY "Students can view active codes" ON course_enrollment_codes
FOR SELECT USING (
  is_active = TRUE
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Teachers can create codes for their courses
CREATE POLICY "Teachers can create course codes" ON course_enrollment_codes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.created_by = auth.uid()
  ) AND created_by = auth.uid()
);

-- Teachers can update their course codes
CREATE POLICY "Teachers can update own course codes" ON course_enrollment_codes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Teachers can delete their course codes
CREATE POLICY "Teachers can delete own course codes" ON course_enrollment_codes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.created_by = auth.uid()
  )
);

-- ========================================
-- 5. CREATE RLS POLICIES FOR CODE USAGE
-- ========================================

-- Students can create usage records (when they use a code)
CREATE POLICY "Students can use enrollment codes" ON enrollment_code_usage
FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can view their own usage
CREATE POLICY "Students can view own code usage" ON enrollment_code_usage
FOR SELECT USING (student_id = auth.uid());

-- Teachers can view usage for their course codes
CREATE POLICY "Teachers can view course code usage" ON enrollment_code_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_enrollment_codes
    JOIN courses ON courses.id = course_enrollment_codes.course_id
    WHERE course_enrollment_codes.id = enrollment_code_usage.code_id
    AND courses.created_by = auth.uid()
  )
);

-- Admins can view usage for school codes
CREATE POLICY "Admins can view school code usage" ON enrollment_code_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_enrollment_codes
    JOIN courses ON courses.id = course_enrollment_codes.course_id
    JOIN profiles ON profiles.id = auth.uid()
    WHERE course_enrollment_codes.id = enrollment_code_usage.code_id
    AND courses.school_id = profiles.school_id
    AND profiles.role = 'admin'
  )
);

-- ========================================
-- 6. CREATE HELPER FUNCTIONS
-- ========================================

-- Function to generate unique enrollment codes
CREATE OR REPLACE FUNCTION generate_enrollment_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM course_enrollment_codes WHERE course_enrollment_codes.code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use enrollment code and enroll student
CREATE OR REPLACE FUNCTION use_enrollment_code(
  p_code TEXT,
  p_student_id UUID
)
RETURNS JSON AS $$
DECLARE
  code_record course_enrollment_codes%ROWTYPE;
  student_profile profiles%ROWTYPE;
  course_record courses%ROWTYPE;
  existing_enrollment UUID;
  result JSON;
BEGIN
  -- Get the code record
  SELECT * INTO code_record 
  FROM course_enrollment_codes 
  WHERE code = p_code AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or inactive enrollment code');
  END IF;
  
  -- Check if code has expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Enrollment code has expired');
  END IF;
  
  -- Check if code has reached max uses
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Enrollment code has reached maximum uses');
  END IF;
  
  -- Get student profile
  SELECT * INTO student_profile 
  FROM profiles 
  WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Student profile not found');
  END IF;
  
  -- Check if student role is correct
  IF student_profile.role != 'student' THEN
    RETURN json_build_object('success', false, 'error', 'Only students can use enrollment codes');
  END IF;
  
  -- Get course record
  SELECT * INTO course_record 
  FROM courses 
  WHERE id = code_record.course_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Course not found');
  END IF;
  
  -- Check if student is in the same school as the course
  IF student_profile.school_id != course_record.school_id THEN
    RETURN json_build_object('success', false, 'error', 'You can only join courses from your school');
  END IF;
  
  -- Check if student is already enrolled
  SELECT id INTO existing_enrollment 
  FROM enrollments 
  WHERE course_id = code_record.course_id AND student_id = p_student_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You are already enrolled in this course');
  END IF;
  
  -- Check if student has already used this specific code
  IF EXISTS(SELECT 1 FROM enrollment_code_usage WHERE code_id = code_record.id AND student_id = p_student_id) THEN
    RETURN json_build_object('success', false, 'error', 'You have already used this enrollment code');
  END IF;
  
  -- Create enrollment
  INSERT INTO enrollments (course_id, student_id, enrollment_method, enrollment_code_id, status)
  VALUES (code_record.course_id, p_student_id, 'code', code_record.id, 'active');
  
  -- Record code usage
  INSERT INTO enrollment_code_usage (code_id, student_id)
  VALUES (code_record.id, p_student_id);
  
  -- Update code usage count
  UPDATE course_enrollment_codes 
  SET current_uses = current_uses + 1 
  WHERE id = code_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Successfully enrolled in course: ' || course_record.title,
    'course_title', course_record.title,
    'course_id', course_record.id,
    'code_uses_remaining', 
      CASE 
        WHEN code_record.max_uses IS NULL THEN 'unlimited'
        ELSE (code_record.max_uses - code_record.current_uses - 1)::text
      END
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'An error occurred: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================

GRANT ALL ON course_enrollment_codes TO authenticated;
GRANT ALL ON enrollment_code_usage TO authenticated;
GRANT EXECUTE ON FUNCTION generate_enrollment_code() TO authenticated;
GRANT EXECUTE ON FUNCTION use_enrollment_code(TEXT, UUID) TO authenticated;

-- ========================================
-- 8. CREATE SAMPLE DATA FOR TESTING
-- ========================================

-- This will be commented out by default - uncomment if you want sample data
/*
-- Generate a sample enrollment code for testing
INSERT INTO course_enrollment_codes (course_id, code, title, description, created_by, max_uses)
SELECT 
  c.id,
  'TEST01',
  'Test Enrollment Code',
  'Sample code for testing enrollment system',
  c.created_by,
  10
FROM courses c 
LIMIT 1;
*/

-- ========================================
-- 9. VERIFICATION QUERIES
-- ========================================

SELECT 'Enrollment system setup complete!' as status;
SELECT 'Tables: course_enrollment_codes, enrollment_code_usage, enrollments (enhanced)' as tables_created;
SELECT 'Functions: generate_enrollment_code(), use_enrollment_code()' as functions_created;
SELECT 'RLS policies created for secure access control' as security;

-- Test the functions work
SELECT 'Testing generate_enrollment_code()...' as test;
SELECT generate_enrollment_code() as sample_code;

-- Show table structures
SELECT 'course_enrollment_codes table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_enrollment_codes' 
ORDER BY ordinal_position;

SELECT 'enrollment_code_usage table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enrollment_code_usage' 
ORDER BY ordinal_position;

SELECT 'Enhanced enrollments table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
ORDER BY ordinal_position;
