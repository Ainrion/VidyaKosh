-- Update RLS Policies for Student Access to Blackboards
-- This allows students to view blackboards for courses they're enrolled in

-- Drop existing policies to update them
DROP POLICY IF EXISTS "Users can view school blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can create blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can update blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can delete blackboards" ON blackboards;
DROP POLICY IF EXISTS "Service role can manage blackboards" ON blackboards;

-- Create updated RLS Policies for blackboards table

-- Students can view blackboards for courses they're enrolled in
-- Teachers and admins can view blackboards for courses in their school
CREATE POLICY "Users can view accessible blackboards" ON blackboards
FOR SELECT USING (
  -- Students can view blackboards for courses they're enrolled in
  (EXISTS (
    SELECT 1 FROM enrollments e
    JOIN profiles p ON p.id = e.student_id
    WHERE e.course_id = blackboards.course_id 
    AND p.id = auth.uid()
    AND p.role = 'student'
  ))
  OR
  -- Teachers and admins can view blackboards for courses in their school
  (EXISTS (
    SELECT 1 FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE c.id = blackboards.course_id
    AND p.id = auth.uid()
    AND p.role IN ('teacher', 'admin')
  ))
);

-- Only teachers and admins can create blackboards
CREATE POLICY "Teachers can create blackboards" ON blackboards
FOR INSERT WITH CHECK (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Only teachers and admins can update blackboards
CREATE POLICY "Teachers can update blackboards" ON blackboards
FOR UPDATE USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Only teachers and admins can delete blackboards
CREATE POLICY "Teachers can delete blackboards" ON blackboards
FOR DELETE USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Allow service role to manage blackboards (for API operations)
CREATE POLICY "Service role can manage blackboards" ON blackboards
FOR ALL USING (auth.role() = 'service_role');

-- Test the policies
DO $$
BEGIN
  RAISE NOTICE 'Updated blackboard RLS policies for student access';
  RAISE NOTICE 'Students can now view blackboards for courses they are enrolled in';
  RAISE NOTICE 'Teachers and admins retain full access to blackboards in their school';
END $$;
