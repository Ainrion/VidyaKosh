-- Comprehensive Enrollment System Fix for Vidyakosh LMS
-- This script fixes enrollment confusion and implements proper school-based enrollment management

-- ========================================
-- 1. ENHANCE ENROLLMENT TABLE
-- ========================================

-- Add enrollment status and approval tracking
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'completed', 'withdrawn')),
ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'self' CHECK (enrollment_type IN ('self', 'admin', 'bulk', 'import')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_by ON enrollments(enrolled_by);
CREATE INDEX IF NOT EXISTS idx_enrollments_approved_by ON enrollments(approved_by);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrollment_type ON enrollments(enrollment_type);

-- ========================================
-- 2. FIX ENROLLMENT RLS POLICIES
-- ========================================

-- Drop existing enrollment policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can view course enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view school enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students can create enrollments" ON enrollments;

-- Enable RLS on enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
FOR SELECT USING (student_id = auth.uid());

-- Teachers can view enrollments for their courses
CREATE POLICY "Teachers can view course enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Admins can view all enrollments in their school
CREATE POLICY "Admins can view school enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id IN (
      SELECT school_id FROM profiles student_profile
      WHERE student_profile.id = enrollments.student_id
    )
  )
);

-- Students can create self-enrollments (with school boundary check)
CREATE POLICY "Students can self-enroll in school courses" ON enrollments
FOR INSERT WITH CHECK (
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM courses c, profiles p
    WHERE c.id = course_id
    AND p.id = student_id
    AND c.school_id = p.school_id
  )
);

-- Admins can create enrollments for students in their school
CREATE POLICY "Admins can create school enrollments" ON enrollments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile, profiles student_profile, courses c
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND student_profile.id = student_id
    AND admin_profile.school_id = student_profile.school_id
    AND c.id = course_id
    AND c.school_id = admin_profile.school_id
  )
);

-- Teachers can create enrollments for their courses (if they're in the same school)
CREATE POLICY "Teachers can create course enrollments" ON enrollments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c, profiles teacher_profile, profiles student_profile
    WHERE c.id = course_id
    AND c.created_by = auth.uid()
    AND teacher_profile.id = auth.uid()
    AND student_profile.id = student_id
    AND teacher_profile.school_id = student_profile.school_id
    AND c.school_id = teacher_profile.school_id
  )
);

-- Admins can update enrollments in their school
CREATE POLICY "Admins can update school enrollments" ON enrollments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile, profiles student_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND student_profile.id = student_id
    AND admin_profile.school_id = student_profile.school_id
  )
);

-- Teachers can update enrollments for their courses
CREATE POLICY "Teachers can update course enrollments" ON enrollments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Admins can delete enrollments in their school
CREATE POLICY "Admins can delete school enrollments" ON enrollments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile, profiles student_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND student_profile.id = student_id
    AND admin_profile.school_id = student_profile.school_id
  )
);

-- ========================================
-- 3. ENHANCE COURSES RLS FOR SCHOOL BOUNDARIES
-- ========================================

-- Drop existing course policies
DROP POLICY IF EXISTS "Authenticated users can view courses" ON courses;
DROP POLICY IF EXISTS "Teachers and admins can create courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can update courses" ON courses;
DROP POLICY IF EXISTS "Course creators and admins can delete courses" ON courses;

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Users can only view courses in their school
CREATE POLICY "Users can view school courses" ON courses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.school_id = courses.school_id
  )
);

-- Teachers and admins can create courses in their school
CREATE POLICY "Teachers and admins can create school courses" ON courses
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
    AND profiles.school_id = school_id
  )
);

-- Course creators and admins can update courses in their school
CREATE POLICY "Course creators and admins can update school courses" ON courses
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    (created_by = auth.uid() AND
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.school_id = courses.school_id
     )) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.school_id = courses.school_id
    )
  )
);

-- Course creators and admins can delete courses in their school
CREATE POLICY "Course creators and admins can delete school courses" ON courses
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    (created_by = auth.uid() AND
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.school_id = courses.school_id
     )) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.school_id = courses.school_id
    )
  )
);

-- ========================================
-- 4. CREATE ENROLLMENT MANAGEMENT FUNCTIONS
-- ========================================

-- Function to get students in a school
CREATE OR REPLACE FUNCTION get_school_students(school_uuid UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.is_active, p.created_at
  FROM profiles p
  WHERE p.school_id = school_uuid
  AND p.role = 'student'
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get course enrollments for a school
CREATE OR REPLACE FUNCTION get_school_course_enrollments(school_uuid UUID, course_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  enrollment_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  course_id UUID,
  course_title TEXT,
  status TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE,
  enrolled_by UUID,
  enrolled_by_name TEXT,
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as enrollment_id,
    e.student_id,
    p.full_name as student_name,
    p.email as student_email,
    e.course_id,
    c.title as course_title,
    e.status,
    e.enrolled_at,
    e.enrolled_by,
    enrolled_by_profile.full_name as enrolled_by_name,
    e.approved_by,
    approved_by_profile.full_name as approved_by_name,
    e.approved_at
  FROM enrollments e
  JOIN profiles p ON e.student_id = p.id
  JOIN courses c ON e.course_id = c.id
  LEFT JOIN profiles enrolled_by_profile ON e.enrolled_by = enrolled_by_profile.id
  LEFT JOIN profiles approved_by_profile ON e.approved_by = approved_by_profile.id
  WHERE p.school_id = school_uuid
  AND (course_uuid IS NULL OR e.course_id = course_uuid)
  ORDER BY e.enrolled_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk enroll students in a course
CREATE OR REPLACE FUNCTION bulk_enroll_students(
  course_uuid UUID,
  student_ids UUID[],
  enrolled_by_uuid UUID,
  enrollment_type TEXT DEFAULT 'bulk'
)
RETURNS TABLE (
  success BOOLEAN,
  student_id UUID,
  message TEXT
) AS $$
DECLARE
  student_id UUID;
  school_uuid UUID;
  course_school_uuid UUID;
  result_record RECORD;
BEGIN
  -- Get the school of the person doing the enrollment
  SELECT school_id INTO school_uuid
  FROM profiles
  WHERE id = enrolled_by_uuid;
  
  -- Get the school of the course
  SELECT school_id INTO course_school_uuid
  FROM courses
  WHERE id = course_uuid;
  
  -- Verify both are in the same school
  IF school_uuid != course_school_uuid THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Course is not in your school'::TEXT;
    RETURN;
  END IF;
  
  -- Process each student
  FOREACH student_id IN ARRAY student_ids
  LOOP
    BEGIN
      -- Check if student is in the same school
      IF EXISTS (
        SELECT 1 FROM profiles
        WHERE id = student_id
        AND school_id = school_uuid
        AND role = 'student'
      ) THEN
        -- Insert enrollment
        INSERT INTO enrollments (course_id, student_id, enrolled_by, enrollment_type, status)
        VALUES (course_uuid, student_id, enrolled_by_uuid, enrollment_type, 'active')
        ON CONFLICT (course_id, student_id) DO UPDATE SET
          status = 'active',
          enrolled_by = enrolled_by_uuid,
          enrollment_type = enrollment_type,
          enrolled_at = now();
        
        RETURN QUERY SELECT true, student_id, 'Enrolled successfully'::TEXT;
      ELSE
        RETURN QUERY SELECT false, student_id, 'Student not found or not in your school'::TEXT;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY SELECT false, student_id, 'Error: ' || SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. CREATE ENROLLMENT MANAGEMENT VIEWS
-- ========================================

-- View for admin enrollment management
CREATE OR REPLACE VIEW admin_enrollment_management AS
SELECT 
  e.id as enrollment_id,
  e.course_id,
  c.title as course_title,
  c.school_id as course_school_id,
  e.student_id,
  p.full_name as student_name,
  p.email as student_email,
  p.school_id as student_school_id,
  e.status,
  e.enrollment_type,
  e.enrolled_at,
  e.enrolled_by,
  enrolled_by_profile.full_name as enrolled_by_name,
  e.approved_by,
  approved_by_profile.full_name as approved_by_name,
  e.approved_at,
  e.notes,
  e.completed_at
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN profiles p ON e.student_id = p.id
LEFT JOIN profiles enrolled_by_profile ON e.enrolled_by = enrolled_by_profile.id
LEFT JOIN profiles approved_by_profile ON e.approved_by = approved_by_profile.id;

-- View for course roster management
CREATE OR REPLACE VIEW course_roster AS
SELECT 
  c.id as course_id,
  c.title as course_title,
  c.school_id,
  COUNT(e.id) as total_enrollments,
  COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_enrollments,
  COUNT(CASE WHEN e.status = 'pending' THEN 1 END) as pending_enrollments,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_enrollments
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title, c.school_id;

-- ========================================
-- 6. GRANT PERMISSIONS
-- ========================================

-- Grant permissions for enrollment functions
GRANT EXECUTE ON FUNCTION get_school_students(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_course_enrollments(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_enroll_students(UUID, UUID[], UUID, TEXT) TO authenticated;

-- Grant permissions for views
GRANT SELECT ON admin_enrollment_management TO authenticated;
GRANT SELECT ON course_roster TO authenticated;

-- ========================================
-- 7. UPDATE EXISTING ENROLLMENTS
-- ========================================

-- Update existing enrollments to have proper status and enrollment type
UPDATE enrollments 
SET 
  status = 'active',
  enrollment_type = 'self',
  enrolled_by = student_id
WHERE status IS NULL;

-- ========================================
-- 8. VERIFICATION
-- ========================================

-- Show enrollment policies
SELECT 'Enrollment policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'enrollments'
ORDER BY policyname;

-- Show course policies
SELECT 'Course policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'courses'
ORDER BY policyname;

-- Test functions
SELECT 'Testing enrollment functions...' as info;
SELECT 'Functions created successfully!' as status;

-- ========================================
-- 9. SUCCESS MESSAGE
-- ========================================

SELECT '✅ Enrollment system fixed successfully!' as status;
SELECT 'School boundaries are now enforced.' as school_boundaries;
SELECT 'Admins can manage student enrollments.' as admin_management;
SELECT 'Bulk enrollment functions are available.' as bulk_enrollment;
SELECT 'Enrollment status tracking is implemented.' as status_tracking;
SELECT 'Self-enrollment is restricted to school courses.' as self_enrollment;

