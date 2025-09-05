-- Fix RLS policies for profiles table to allow proper profile creation during setup
-- Run this in your Supabase SQL Editor

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create permissive policies for setup and basic functionality
-- Allow authenticated users to create their own profile (needed for setup)
CREATE POLICY "Authenticated users can create profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated  
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- Allow admins to view all profiles in their school
CREATE POLICY "Admins can view school profiles" ON profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id = profiles.school_id
  )
);

-- Allow admins to update profiles in their school
CREATE POLICY "Admins can update school profiles" ON profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id = profiles.school_id
  )
);

-- Allow teachers to view student profiles in their courses
CREATE POLICY "Teachers can view student profiles" ON profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM course_teachers ct
    JOIN enrollments e ON ct.course_id = e.course_id
    JOIN profiles teacher_profile ON ct.teacher_id = teacher_profile.id
    WHERE teacher_profile.id = auth.uid()
    AND e.student_id = profiles.id
  )
);

-- Ensure the profiles table has the correct structure
-- Add any missing columns if needed
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
