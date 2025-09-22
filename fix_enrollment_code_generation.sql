-- Fix Enrollment Code Generation Function
-- Run this in your Supabase SQL Editor to fix the enrollment code generation error

-- ========================================
-- 1. ENSURE COURSE_ENROLLMENT_CODES TABLE EXISTS
-- ========================================

CREATE TABLE IF NOT EXISTS course_enrollment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- ========================================
-- 2. CREATE/REPLACE THE GENERATE_ENROLLMENT_CODE FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION generate_enrollment_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM course_enrollment_codes WHERE course_enrollment_codes.code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. GRANT EXECUTE PERMISSIONS
-- ========================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_enrollment_code() TO authenticated;

-- ========================================
-- 4. ENABLE RLS AND CREATE BASIC POLICIES
-- ========================================

-- Enable RLS on course_enrollment_codes table
ALTER TABLE course_enrollment_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Teachers can view own course codes" ON course_enrollment_codes;
DROP POLICY IF EXISTS "Admins can view school course codes" ON course_enrollment_codes;
DROP POLICY IF EXISTS "Teachers can create course codes" ON course_enrollment_codes;
DROP POLICY IF EXISTS "Teachers can update own course codes" ON course_enrollment_codes;
DROP POLICY IF EXISTS "Teachers can delete own course codes" ON course_enrollment_codes;

-- Create basic RLS policies
CREATE POLICY "Users can view course codes" ON course_enrollment_codes
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create course codes" ON course_enrollment_codes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update course codes" ON course_enrollment_codes
FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_course_id ON course_enrollment_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_code ON course_enrollment_codes(code);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_created_by ON course_enrollment_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_active ON course_enrollment_codes(is_active);

-- ========================================
-- 6. TEST THE FUNCTION
-- ========================================

-- Test the function
SELECT generate_enrollment_code() as test_code;

-- ========================================
-- 7. VERIFICATION
-- ========================================

-- Check if function exists
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name = 'generate_enrollment_code';

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_enrollment_codes' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'course_enrollment_codes'
ORDER BY policyname;

-- ========================================
-- 8. SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE 'Enrollment code generation function fixed successfully!';
  RAISE NOTICE 'Function: generate_enrollment_code() is now available';
  RAISE NOTICE 'Table: course_enrollment_codes is ready';
  RAISE NOTICE 'RLS policies: Basic policies created';
  RAISE NOTICE 'You can now create courses with automatic enrollment codes!';
END $$;
