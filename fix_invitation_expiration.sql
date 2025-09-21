-- Fix invitation expiration issue
-- Run this in your Supabase SQL Editor

-- First, check if the school_invitations table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_invitations') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE school_invitations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          invitation_code TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
          invited_by UUID REFERENCES profiles(id) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
          accepted_at TIMESTAMP WITH TIME ZONE,
          accepted_by UUID REFERENCES profiles(id),
          message TEXT
        );
        
        -- Create indexes
        CREATE INDEX idx_school_invitations_school_id ON school_invitations(school_id);
        CREATE INDEX idx_school_invitations_email ON school_invitations(email);
        CREATE INDEX idx_school_invitations_code ON school_invitations(invitation_code);
        CREATE INDEX idx_school_invitations_status ON school_invitations(status);
        CREATE INDEX idx_school_invitations_expires_at ON school_invitations(expires_at);
        
        -- Enable RLS
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
          
        RAISE NOTICE 'school_invitations table created successfully';
    ELSE
        RAISE NOTICE 'school_invitations table already exists';
    END IF;
END $$;

-- Check current invitations and their expiration status
SELECT 
  'Current Invitations Status' as info,
  COUNT(*) as total_invitations,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM school_invitations;

-- Show recent invitations with expiration details
SELECT 
  id,
  email,
  invitation_code,
  role,
  status,
  created_at,
  expires_at,
  NOW() as current_time,
  (expires_at - NOW()) as time_remaining,
  CASE 
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as expiration_status
FROM school_invitations 
ORDER BY created_at DESC
LIMIT 5;

-- Update any invitations that should be marked as expired
UPDATE school_invitations 
SET status = 'expired'
WHERE status = 'pending' 
  AND expires_at <= NOW();

-- Show the count of updated invitations
SELECT 'Updated expired invitations' as info, ROW_COUNT() as count;
