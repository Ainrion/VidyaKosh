-- Complete Course Enrollment Codes System
-- This creates all the necessary tables and functions for the course codes feature

-- 1. Create course_enrollment_codes table
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

-- 2. Create enrollment_code_usage table to track who used which codes
CREATE TABLE IF NOT EXISTS enrollment_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES course_enrollment_codes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code_id, student_id) -- Prevent duplicate usage
);

-- 3. Add enrollment_code_id to enrollments table if it doesn't exist
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS enrollment_code_id UUID REFERENCES course_enrollment_codes(id);

-- 4. Enable RLS on the new tables
ALTER TABLE course_enrollment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_code_usage ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for course_enrollment_codes

-- Teachers can view codes for their courses
CREATE POLICY "Teachers can view own course codes" ON course_enrollment_codes
FOR SELECT USING (
  course_id IN (
    SELECT id FROM courses 
    WHERE created_by = auth.uid()
  )
);

-- Admins can view codes for school courses
CREATE POLICY "Admins can view school course codes" ON course_enrollment_codes
FOR SELECT USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Students can view active codes (for joining)
CREATE POLICY "Students can view active codes" ON course_enrollment_codes
FOR SELECT USING (
  is_active = true AND 
  (expires_at IS NULL OR expires_at > now()) AND
  (max_uses IS NULL OR current_uses < max_uses)
);

-- Teachers can create codes for their courses
CREATE POLICY "Teachers can create course codes" ON course_enrollment_codes
FOR INSERT WITH CHECK (
  course_id IN (
    SELECT id FROM courses 
    WHERE created_by = auth.uid()
  )
);

-- Teachers can update their course codes
CREATE POLICY "Teachers can update own course codes" ON course_enrollment_codes
FOR UPDATE USING (
  course_id IN (
    SELECT id FROM courses 
    WHERE created_by = auth.uid()
  )
);

-- Teachers can delete their course codes
CREATE POLICY "Teachers can delete own course codes" ON course_enrollment_codes
FOR DELETE USING (
  course_id IN (
    SELECT id FROM courses 
    WHERE created_by = auth.uid()
  )
);

-- 6. Create RLS Policies for enrollment_code_usage

-- Teachers can view usage for their course codes
CREATE POLICY "Teachers can view course code usage" ON enrollment_code_usage
FOR SELECT USING (
  code_id IN (
    SELECT course_enrollment_codes.id 
    FROM course_enrollment_codes
    JOIN courses ON courses.id = course_enrollment_codes.course_id
    WHERE courses.created_by = auth.uid()
  )
);

-- Students can insert their own usage records
CREATE POLICY "Students can insert own usage" ON enrollment_code_usage
FOR INSERT WITH CHECK (
  student_id = auth.uid()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_course_id ON course_enrollment_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_code ON course_enrollment_codes(code);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_created_by ON course_enrollment_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_active ON course_enrollment_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollment_code_usage_code_id ON enrollment_code_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_code_usage_student_id ON enrollment_code_usage(student_id);

-- 8. Grant necessary permissions
GRANT ALL ON course_enrollment_codes TO authenticated;
GRANT ALL ON enrollment_code_usage TO authenticated;

-- 9. Create function to generate unique enrollment codes
CREATE OR REPLACE FUNCTION generate_enrollment_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code (letters and numbers)
    new_code := upper(
      substring(
        (array_to_string(ARRAY(
          SELECT chr((ascii('A') + round(random() * 25))::integer)
          FROM generate_series(1, 4)
        ), '')) ||
        (array_to_string(ARRAY(
          SELECT chr((ascii('0') + round(random() * 9))::integer)
          FROM generate_series(1, 4)
        ), ''))
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM course_enrollment_codes WHERE course_enrollment_codes.code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to use an enrollment code
CREATE OR REPLACE FUNCTION use_enrollment_code(
  p_code TEXT,
  p_student_id UUID
)
RETURNS JSON AS $$
DECLARE
  code_record course_enrollment_codes%ROWTYPE;
  course_record courses%ROWTYPE;
  enrollment_exists BOOLEAN;
  result JSON;
BEGIN
  -- Get the enrollment code record
  SELECT * INTO code_record
  FROM course_enrollment_codes 
  WHERE code = p_code 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  -- Check if code exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired enrollment code'
    );
  END IF;
  
  -- Get the course record
  SELECT * INTO course_record
  FROM courses 
  WHERE id = code_record.course_id;
  
  -- Check if student is already enrolled
  SELECT EXISTS(
    SELECT 1 FROM enrollments 
    WHERE course_id = code_record.course_id AND student_id = p_student_id
  ) INTO enrollment_exists;
  
  IF enrollment_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You are already enrolled in this course'
    );
  END IF;
  
  -- Create enrollment
  INSERT INTO enrollments (course_id, student_id, enrollment_code_id)
  VALUES (code_record.course_id, p_student_id, code_record.id);
  
  -- Record the usage
  INSERT INTO enrollment_code_usage (code_id, student_id)
  VALUES (code_record.id, p_student_id);
  
  -- Update usage count
  UPDATE course_enrollment_codes 
  SET current_uses = current_uses + 1
  WHERE id = code_record.id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'course', json_build_object(
      'id', course_record.id,
      'title', course_record.title,
      'description', course_record.description
    ),
    'message', 'Successfully enrolled in course'
  );
END;
$$ LANGUAGE plpgsql;

-- 11. Test the setup
DO $$
BEGIN
  RAISE NOTICE 'Course enrollment codes system created successfully!';
  RAISE NOTICE 'Tables: course_enrollment_codes, enrollment_code_usage';
  RAISE NOTICE 'Functions: generate_enrollment_code(), use_enrollment_code()';
  RAISE NOTICE 'RLS policies: Created for all tables';
END $$;

-- 12. Show table structure
SELECT 'course_enrollment_codes table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'course_enrollment_codes'
ORDER BY ordinal_position;
