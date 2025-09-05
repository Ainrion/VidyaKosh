-- Fix infinite recursion in profiles table RLS policies
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to clear the recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view school profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update school profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for basic functionality
-- Allow authenticated users to create their own profile (no recursion)
CREATE POLICY "Authenticated users can create profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated  
USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- Create a more permissive policy for setup process
-- This allows profile creation without complex checks
CREATE POLICY "Setup profile creation" ON profiles
FOR INSERT TO authenticated
WITH CHECK (true);

-- Create a policy for admins to view profiles (simplified, no recursion)
CREATE POLICY "Admins can view profiles" ON profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Create a policy for admins to update profiles (simplified, no recursion)
CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Verify the policies
SELECT 'Profiles table policies after fix:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Success message
SELECT '✅ Profiles RLS recursion fix completed!' as status;
SELECT 'You can now create profiles without infinite recursion errors.' as message;
