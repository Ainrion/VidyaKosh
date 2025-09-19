-- Complete Enrollment System with Email Invitations
-- Run this in Supabase SQL Editor

-- ========================================
-- 1. EMAIL INVITATION SYSTEM
-- ========================================

-- Create school invitations table
CREATE TABLE IF NOT EXISTS school_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES profiles(id),
  message TEXT
);

-- ========================================
-- 2. STUDENT ACCESS MANAGEMENT
-- ========================================

-- Add school access management to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_access_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS school_access_granted_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS school_access_granted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES school_invitations(id);

-- ========================================
-- 3. COURSE ENROLLMENT CODES (Discord-style)
-- ========================================

-- Create course enrollment codes table
CREATE TABLE IF NOT EXISTS course_enrollment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  title TEXT -- Custom title for the code
);

-- Create enrollment code usage tracking
CREATE TABLE IF NOT EXISTS enrollment_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES course_enrollment_codes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code_id, student_id) -- Prevent duplicate usage
);

-- ========================================
-- 4. UPDATE ENROLLMENTS TABLE
-- ========================================

-- Update enrollments table to track enrollment method
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS enrollment_method TEXT DEFAULT 'direct' CHECK (enrollment_method IN ('direct', 'code', 'admin', 'invitation')),
ADD COLUMN IF NOT EXISTS enrollment_code_id UUID REFERENCES course_enrollment_codes(id),
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES school_invitations(id);

-- ========================================
-- 5. ENABLE RLS ON NEW TABLES
-- ========================================

ALTER TABLE school_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_code_usage ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. RLS POLICIES FOR SCHOOL INVITATIONS
-- ========================================

-- Admins can view all invitations for their school
CREATE POLICY "Admins can view school invitations" ON school_invitations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.school_id = school_invitations.school_id
  )
);

-- Admins can create invitations for their school
CREATE POLICY "Admins can create school invitations" ON school_invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.school_id = school_invitations.school_id
  )
);

-- Admins can update invitations for their school
CREATE POLICY "Admins can update school invitations" ON school_invitations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.school_id = school_invitations.school_id
  )
);

-- Admins can delete invitations for their school
CREATE POLICY "Admins can delete school invitations" ON school_invitations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.school_id = school_invitations.school_id
  )
);

-- Anyone can view invitations by code (for signup process)
CREATE POLICY "Anyone can view invitation by code" ON school_invitations
FOR SELECT USING (true);

-- ========================================
-- 7. RLS POLICIES FOR COURSE ENROLLMENT CODES
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

-- Admins can view all codes in their school
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

-- Teachers can create codes for their courses
CREATE POLICY "Teachers can create course codes" ON course_enrollment_codes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Teachers can update codes for their courses
CREATE POLICY "Teachers can update own course codes" ON course_enrollment_codes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Teachers can delete codes for their courses
CREATE POLICY "Teachers can delete own course codes" ON course_enrollment_codes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollment_codes.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Anyone can view active codes (for enrollment process)
CREATE POLICY "Anyone can view active codes" ON course_enrollment_codes
FOR SELECT USING (is_active = true);

-- ========================================
-- 8. RLS POLICIES FOR ENROLLMENT CODE USAGE
-- ========================================

-- Students can view their own code usage
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

-- Students can create usage records (when they use a code)
CREATE POLICY "Students can use enrollment codes" ON enrollment_code_usage
FOR INSERT WITH CHECK (student_id = auth.uid());

-- ========================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_school_invitations_school_id ON school_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_school_invitations_email ON school_invitations(email);
CREATE INDEX IF NOT EXISTS idx_school_invitations_code ON school_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_school_invitations_status ON school_invitations(status);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_course_id ON course_enrollment_codes(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_code ON course_enrollment_codes(code);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_codes_created_by ON course_enrollment_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_enrollment_code_usage_code_id ON enrollment_code_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_code_usage_student_id ON enrollment_code_usage(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_access ON profiles(school_access_granted);
CREATE INDEX IF NOT EXISTS idx_profiles_invitation_id ON profiles(invitation_id);

-- ========================================
-- 10. GRANT PERMISSIONS
-- ========================================

GRANT ALL ON school_invitations TO authenticated;
GRANT ALL ON course_enrollment_codes TO authenticated;
GRANT ALL ON enrollment_code_usage TO authenticated;

-- ========================================
-- 11. CREATE HELPER FUNCTIONS
-- ========================================

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  new_invitation_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    new_invitation_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM school_invitations WHERE school_invitations.invitation_code = new_invitation_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_invitation_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate enrollment codes
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
$$ LANGUAGE plpgsql;

-- Function to accept school invitation
CREATE OR REPLACE FUNCTION accept_school_invitation(
  p_invitation_code TEXT,
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT
)
RETURNS JSON AS $$
DECLARE
  invitation_record school_invitations%ROWTYPE;
  school_record schools%ROWTYPE;
  result JSON;
BEGIN
  -- Get the invitation record
  SELECT * INTO invitation_record 
  FROM school_invitations 
  WHERE invitation_code = p_invitation_code 
  AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation code');
  END IF;
  
  -- Check if invitation has expired
  IF invitation_record.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE school_invitations 
    SET status = 'expired' 
    WHERE id = invitation_record.id;
    
    RETURN json_build_object('success', false, 'error', 'Invitation has expired');
  END IF;
  
  -- Get school information
  SELECT * INTO school_record 
  FROM schools 
  WHERE id = invitation_record.school_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'School not found');
  END IF;
  
  -- Check if email matches
  IF invitation_record.email != p_email THEN
    RETURN json_build_object('success', false, 'error', 'Email does not match invitation');
  END IF;
  
  -- Update user profile with school access
  UPDATE profiles 
  SET 
    school_id = invitation_record.school_id,
    school_access_granted = true,
    school_access_granted_by = invitation_record.invited_by,
    school_access_granted_at = NOW(),
    invitation_id = invitation_record.id,
    full_name = p_full_name
  WHERE id = p_user_id;
  
  -- Mark invitation as accepted
  UPDATE school_invitations 
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = p_user_id
  WHERE id = invitation_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Successfully joined school',
    'school_name', school_record.name,
    'school_id', school_record.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use enrollment code
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
    RETURN json_build_object('success', false, 'error', 'Invalid or inactive code');
  END IF;
  
  -- Check if code has expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Code has expired');
  END IF;
  
  -- Check if code has reached max uses
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'Code has reached maximum uses');
  END IF;
  
  -- Get student profile
  SELECT * INTO student_profile 
  FROM profiles 
  WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;
  
  -- Check if student has school access
  IF NOT student_profile.school_access_granted THEN
    RETURN json_build_object('success', false, 'error', 'Student does not have school access. Contact your administrator.');
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
  
  -- Check if student has already used this code
  IF EXISTS(SELECT 1 FROM enrollment_code_usage WHERE code_id = code_record.id AND student_id = p_student_id) THEN
    RETURN json_build_object('success', false, 'error', 'You have already used this code');
  END IF;
  
  -- Create enrollment
  INSERT INTO enrollments (course_id, student_id, enrollment_method, enrollment_code_id)
  VALUES (code_record.course_id, p_student_id, 'code', code_record.id);
  
  -- Record code usage
  INSERT INTO enrollment_code_usage (code_id, student_id)
  VALUES (code_record.id, p_student_id);
  
  -- Update code usage count
  UPDATE course_enrollment_codes 
  SET current_uses = current_uses + 1 
  WHERE id = code_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Successfully enrolled in course',
    'course_title', course_record.title,
    'code_uses_remaining', 
      CASE 
        WHEN code_record.max_uses IS NULL THEN 'unlimited'
        ELSE (code_record.max_uses - code_record.current_uses - 1)::text
      END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 12. GRANT EXECUTE PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION generate_invitation_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_enrollment_code() TO authenticated;
GRANT EXECUTE ON FUNCTION accept_school_invitation(TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION use_enrollment_code(TEXT, UUID) TO authenticated;

-- ========================================
-- 13. VERIFY SETUP
-- ========================================

SELECT 'Complete enrollment system setup complete!' as status;
SELECT 'Tables created: school_invitations, course_enrollment_codes, enrollment_code_usage' as tables;
SELECT 'Functions created: generate_invitation_code(), generate_enrollment_code(), accept_school_invitation(), use_enrollment_code()' as functions;
SELECT 'Features: Email invitations, Discord-style course codes, Admin approval dashboard' as features;


