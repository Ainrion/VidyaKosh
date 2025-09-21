-- Fix RLS policies for school creation
-- This allows public school creation during registration

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage schools" ON schools;

-- Allow public school creation (for registration)
CREATE POLICY "Allow public school creation" ON schools
FOR INSERT WITH CHECK (TRUE);

-- Allow authenticated users to read schools (for setup and selection)
CREATE POLICY "Authenticated users can view schools" ON schools
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to update their school
CREATE POLICY "Admins can update their school" ON schools
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.school_id = schools.id
  )
);

-- Allow admins to delete their school (if needed)
CREATE POLICY "Admins can delete their school" ON schools
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.school_id = schools.id
  )
);

-- Also ensure service role can manage schools
CREATE POLICY "Service role can manage schools" ON schools
FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
