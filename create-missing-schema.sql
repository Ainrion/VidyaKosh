-- Create missing database schema for Vidyakosh LMS
-- Run this in your Supabase SQL Editor

-- 1. Create schools table (required for school_invitations)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes for schools table
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);

-- 3. Enable RLS for schools
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for schools
DROP POLICY IF EXISTS "Users can view their school" ON schools;
CREATE POLICY "Users can view their school" ON schools
  FOR SELECT USING (
    id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create schools" ON schools;
CREATE POLICY "Admins can create schools" ON schools
  FOR INSERT WITH CHECK (true); -- Allow initial school creation

DROP POLICY IF EXISTS "Admins can update their school" ON schools;
CREATE POLICY "Admins can update their school" ON schools
  FOR UPDATE USING (
    id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Create school_invitations table (now that schools exists)
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
  message TEXT,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  join_token TEXT UNIQUE
);

-- 6. Create indexes for school_invitations table
CREATE INDEX IF NOT EXISTS idx_school_invitations_school_id ON school_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_school_invitations_email ON school_invitations(email);
CREATE INDEX IF NOT EXISTS idx_school_invitations_code ON school_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_school_invitations_status ON school_invitations(status);
CREATE INDEX IF NOT EXISTS idx_school_invitations_expires_at ON school_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_school_invitations_role ON school_invitations(role);
CREATE INDEX IF NOT EXISTS idx_school_invitations_join_token ON school_invitations(join_token);
CREATE INDEX IF NOT EXISTS idx_school_invitations_school_role ON school_invitations(school_id, role);

-- 7. Enable RLS for school_invitations
ALTER TABLE school_invitations ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for school_invitations
DROP POLICY IF EXISTS "Users can view invitations for their school" ON school_invitations;
CREATE POLICY "Users can view invitations for their school" ON school_invitations
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create invitations for their school" ON school_invitations;
CREATE POLICY "Admins can create invitations for their school" ON school_invitations
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) AND invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update invitations for their school" ON school_invitations;
CREATE POLICY "Admins can update invitations for their school" ON school_invitations
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete invitations for their school" ON school_invitations;
CREATE POLICY "Admins can delete invitations for their school" ON school_invitations
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. Create function to generate unique invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM school_invitations WHERE invitation_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Update existing profiles to have a school_id if they don't have one
-- First, create VIPS School if none exists
INSERT INTO schools (id, name, email, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'VIPS School',
  'admin@vipsschool.com',
  now()
WHERE NOT EXISTS (SELECT 1 FROM schools LIMIT 1);

-- Update profiles without school_id to use the default school
UPDATE profiles 
SET school_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE school_id IS NULL;

-- 11. Verify the setup
SELECT 'Database schema created successfully' as status;

-- 12. Show created tables
SELECT 
  'Created Tables:' as info,
  table_name,
  '✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('schools', 'school_invitations')
ORDER BY table_name;

-- 13. Show table structures
SELECT 
  'Schools Table Structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'schools' 
ORDER BY ordinal_position;

SELECT 
  'School Invitations Table Structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'school_invitations' 
ORDER BY ordinal_position;

-- 14. Test the tables
SELECT 
  'Test Results:' as info,
  (SELECT COUNT(*) FROM schools) as schools_count,
  (SELECT COUNT(*) FROM school_invitations) as invitations_count,
  (SELECT COUNT(*) FROM profiles WHERE school_id IS NOT NULL) as profiles_with_school;
