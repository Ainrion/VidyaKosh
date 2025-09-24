-- Add missing profile fields (phone and bio) to profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add phone and bio columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update the database types to include these new fields
-- (This is for reference - the actual types will be updated when you regenerate them)

-- Add indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Update RLS policies to allow users to update their own phone and bio
-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policy that includes phone and bio
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the update (optional - remove this after testing)
-- UPDATE profiles SET phone = 'test-phone', bio = 'test bio' WHERE id = auth.uid();

