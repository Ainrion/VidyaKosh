-- Simplified RLS Policies for blackboards table
-- This allows teachers and admins to manage blackboards more easily

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view school blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can create blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can update blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can delete blackboards" ON blackboards;
DROP POLICY IF EXISTS "Service role can manage blackboards" ON blackboards;

-- Enable RLS on blackboards table
ALTER TABLE blackboards ENABLE ROW LEVEL SECURITY;

-- Users can view blackboards for courses in their school
CREATE POLICY "Users can view school blackboards" ON blackboards
FOR SELECT USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid()
  )
);

-- Teachers and admins can create blackboards for courses in their school
CREATE POLICY "Teachers can create blackboards" ON blackboards
FOR INSERT WITH CHECK (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Teachers and admins can update blackboards for courses in their school
CREATE POLICY "Teachers can update blackboards" ON blackboards
FOR UPDATE USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Teachers and admins can delete blackboards for courses in their school
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
