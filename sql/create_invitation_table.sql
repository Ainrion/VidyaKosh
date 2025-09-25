-- Create school_invitations table for Vidyakosh LMS
-- Run this in your Supabase SQL Editor

-- Create school_invitations table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_invitations_school_id ON school_invitations(school_id);
CREATE INDEX IF NOT EXISTS idx_school_invitations_email ON school_invitations(email);
CREATE INDEX IF NOT EXISTS idx_school_invitations_code ON school_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_school_invitations_status ON school_invitations(status);
CREATE INDEX IF NOT EXISTS idx_school_invitations_expires_at ON school_invitations(expires_at);

-- Enable Row Level Security
ALTER TABLE school_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view invitations for their school" ON school_invitations
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can create invitations for their school" ON school_invitations
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) AND invited_by = auth.uid()
  );

CREATE POLICY "Admins can update invitations for their school" ON school_invitations
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invitations for their school" ON school_invitations
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to generate unique invitation codes
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

-- Test the table creation
SELECT 'school_invitations table created successfully' as status;

