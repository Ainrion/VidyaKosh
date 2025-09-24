-- RLS Policies for blackboards table
-- This allows teachers and admins to manage blackboards for their courses

-- Users can view blackboards for courses in their school
CREATE POLICY "Users can view school blackboards" ON blackboards
FOR SELECT USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid()
  )
);

-- Teachers can create blackboards for their courses
CREATE POLICY "Teachers can create blackboards" ON blackboards
FOR INSERT WITH CHECK (
  course_id IN (
    SELECT ct.course_id FROM course_teachers ct
    WHERE ct.teacher_id = auth.uid()
  ) OR
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Teachers can update blackboards for their courses
CREATE POLICY "Teachers can update blackboards" ON blackboards
FOR UPDATE USING (
  course_id IN (
    SELECT ct.course_id FROM course_teachers ct
    WHERE ct.teacher_id = auth.uid()
  ) OR
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Teachers can delete blackboards for their courses
CREATE POLICY "Teachers can delete blackboards" ON blackboards
FOR DELETE USING (
  course_id IN (
    SELECT ct.course_id FROM course_teachers ct
    WHERE ct.teacher_id = auth.uid()
  ) OR
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Allow service role to manage blackboards (for API operations)
CREATE POLICY "Service role can manage blackboards" ON blackboards
FOR ALL USING (auth.role() = 'service_role');
