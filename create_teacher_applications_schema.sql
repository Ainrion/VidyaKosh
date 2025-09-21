-- Teacher Applications System
-- This allows teachers to apply to schools and admins to approve them

-- Create teacher applications table
CREATE TABLE IF NOT EXISTS teacher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_applications_school_id ON teacher_applications(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_status ON teacher_applications(status);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_teacher_email ON teacher_applications(teacher_email);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_created_at ON teacher_applications(created_at);

-- Enable RLS
ALTER TABLE teacher_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Teachers can view own applications" ON teacher_applications;
DROP POLICY IF EXISTS "Admins can view school applications" ON teacher_applications;
DROP POLICY IF EXISTS "Teachers can create applications" ON teacher_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON teacher_applications;
DROP POLICY IF EXISTS "Service role can manage applications" ON teacher_applications;

-- RLS Policies for teacher_applications table

-- Teachers can view their own applications
CREATE POLICY "Teachers can view own applications" ON teacher_applications
FOR SELECT USING (teacher_email = auth.jwt() ->> 'email');

-- Admins can view applications for their school
CREATE POLICY "Admins can view school applications" ON teacher_applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND p.school_id = teacher_applications.school_id
  )
);

-- Anyone can create applications (for public teacher signup)
CREATE POLICY "Teachers can create applications" ON teacher_applications
FOR INSERT WITH CHECK (TRUE);

-- Admins can update applications for their school
CREATE POLICY "Admins can update applications" ON teacher_applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND p.school_id = teacher_applications.school_id
  )
);

-- Allow service role to manage applications (for API operations)
CREATE POLICY "Service role can manage applications" ON teacher_applications
FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Function to approve a teacher application
CREATE OR REPLACE FUNCTION approve_teacher_application(
  application_id UUID,
  admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  app_record teacher_applications%ROWTYPE;
  admin_profile profiles%ROWTYPE;
  result JSONB;
BEGIN
  -- Get the application
  SELECT * INTO app_record
  FROM teacher_applications
  WHERE id = application_id AND status = 'pending';

  IF app_record IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'Application not found or already processed.');
  END IF;

  -- Get admin profile
  SELECT * INTO admin_profile
  FROM profiles
  WHERE id = admin_id AND role = 'admin' AND school_id = app_record.school_id;

  IF admin_profile IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'Unauthorized to approve this application.');
  END IF;

  -- Update application status
  UPDATE teacher_applications
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = admin_id
  WHERE id = application_id;

  -- Return success
  SELECT json_build_object(
    'success', TRUE,
    'message', 'Teacher application approved successfully.',
    'application_id', application_id,
    'teacher_email', app_record.teacher_email,
    'teacher_name', app_record.teacher_name
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a teacher application
CREATE OR REPLACE FUNCTION reject_teacher_application(
  application_id UUID,
  admin_id UUID,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  app_record teacher_applications%ROWTYPE;
  admin_profile profiles%ROWTYPE;
  result JSONB;
BEGIN
  -- Get the application
  SELECT * INTO app_record
  FROM teacher_applications
  WHERE id = application_id AND status = 'pending';

  IF app_record IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'Application not found or already processed.');
  END IF;

  -- Get admin profile
  SELECT * INTO admin_profile
  FROM profiles
  WHERE id = admin_id AND role = 'admin' AND school_id = app_record.school_id;

  IF admin_profile IS NULL THEN
    RETURN json_build_object('success', FALSE, 'message', 'Unauthorized to reject this application.');
  END IF;

  -- Update application status
  UPDATE teacher_applications
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = admin_id,
    rejection_reason = rejection_reason
  WHERE id = application_id;

  -- Return success
  SELECT json_build_object(
    'success', TRUE,
    'message', 'Teacher application rejected.',
    'application_id', application_id,
    'teacher_email', app_record.teacher_email,
    'teacher_name', app_record.teacher_name
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Teacher applications system created successfully' as status;
SELECT 'Tables created: teacher_applications' as tables;
SELECT 'Functions created: approve_teacher_application(), reject_teacher_application()' as functions;
SELECT 'RLS policies applied for teacher_applications' as rls_status;
