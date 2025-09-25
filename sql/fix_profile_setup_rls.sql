-- Fix RLS policies for profile creation during setup
-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view school profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert school profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update school profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile during setup (this is the key policy)
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow viewing profiles in the same school (for teachers/admins)
CREATE POLICY "School members can view school profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles viewer_profile
    WHERE viewer_profile.id = auth.uid()
    AND (
      viewer_profile.school_id = profiles.school_id
      OR viewer_profile.role = 'admin'
    )
  )
);
