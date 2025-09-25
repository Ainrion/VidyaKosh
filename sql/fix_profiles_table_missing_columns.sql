-- Fix profiles table - Add missing columns for invitation system
-- This fixes the "Failed to create user profile" error

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_access_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS school_access_granted_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS school_access_granted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES school_invitations(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_access ON profiles(school_access_granted);

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate policies with new columns
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to insert profiles (for signup)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Test the fix
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN (
    'school_access_granted', 
    'school_access_granted_by', 
    'school_access_granted_at', 
    'invitation_id'
  )
ORDER BY column_name;
