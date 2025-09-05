-- Fix RLS policies for schools table to allow proper access during setup
-- Run this in your Supabase SQL Editor

-- Enable RLS on schools table if not already enabled
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all users to view schools" ON schools;
DROP POLICY IF EXISTS "Allow authenticated users to create schools" ON schools;
DROP POLICY IF EXISTS "Allow admins to manage schools" ON schools;

-- Create permissive policies for setup and basic functionality
-- Allow all authenticated users to view schools (needed for setup)
CREATE POLICY "Allow all users to view schools" ON schools
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to create schools (needed for setup)
CREATE POLICY "Allow authenticated users to create schools" ON schools
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow admins to update and delete schools
CREATE POLICY "Allow admins to manage schools" ON schools
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Also create a policy for the setup process that bypasses RLS temporarily
-- This allows the setup API to work even if user doesn't have a profile yet
CREATE POLICY "Allow setup process" ON schools
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure the schools table has the correct structure
-- Add any missing columns if needed
DO $$ 
BEGIN
    -- Add logo_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schools' AND column_name = 'logo_url') THEN
        ALTER TABLE schools ADD COLUMN logo_url TEXT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'schools' AND column_name = 'created_at') THEN
        ALTER TABLE schools ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Insert a default school if none exists
INSERT INTO schools (name, address, email, phone) 
SELECT 'Default School', 'Sample Address', 'admin@defaultschool.edu', '+1-555-0123'
WHERE NOT EXISTS (SELECT 1 FROM schools LIMIT 1);

-- Grant necessary permissions
GRANT ALL ON schools TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
