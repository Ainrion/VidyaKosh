-- Temporary fix: Allow authenticated users to create profiles
-- This should be run in Supabase SQL editor

-- First, check current policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Drop restrictive policies and add permissive ones for setup
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive insert policy for setup
CREATE POLICY "Authenticated users can create profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Also ensure select works
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);
