-- Disable RLS for profiles table to allow profile creation during setup
-- Run this in your Supabase SQL Editor

-- Completely disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view school profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update school profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Setup profile creation" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Grant all permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Verify RLS is disabled
SELECT 'Profiles table RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Success message
SELECT '✅ Profiles RLS disabled successfully!' as status;
SELECT 'You can now create profiles without any RLS restrictions.' as message;
SELECT 'Remember to re-enable RLS later for production security.' as warning;
