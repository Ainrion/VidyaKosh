-- Fix Messaging System Database Schema - Version 2
-- This script creates all necessary tables and functions for the messaging system
-- Fixed to handle missing foreign key references properly

-- First, let's check what tables and columns exist
-- Create channels table with proper references
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_id UUID NOT NULL,
  created_by UUID NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  course_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Add foreign key constraints only if the referenced tables exist
-- We'll add these constraints conditionally

-- Add foreign key for school_id if schools table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
        -- Drop constraint if it exists
        ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_school_id_fkey;
        -- Add the constraint
        ALTER TABLE channels ADD CONSTRAINT channels_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for created_by if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Drop constraint if it exists
        ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_created_by_fkey;
        -- Add the constraint
        ALTER TABLE channels ADD CONSTRAINT channels_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for course_id if courses table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        -- Drop constraint if it exists
        ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_course_id_fkey;
        -- Add the constraint
        ALTER TABLE channels ADD CONSTRAINT channels_course_id_fkey 
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key for sender_id in messages table if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Drop constraint if it exists
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
        -- Add the constraint
        ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
            FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channels_school_id ON channels(school_id);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channels_course_id ON channels(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

-- Enable RLS on both tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view channels from their school" ON channels;
DROP POLICY IF EXISTS "Admins can create channels" ON channels;
DROP POLICY IF EXISTS "Channel creators can update their channels" ON channels;
DROP POLICY IF EXISTS "Channel creators can delete their channels" ON channels;
DROP POLICY IF EXISTS "Users can view messages from their school channels" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their school channels" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Create RLS policies with better error handling
-- Channels RLS Policies
CREATE POLICY "Users can view channels from their school" ON channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.school_id = channels.school_id
      AND profiles.school_id IS NOT NULL
    )
  );

CREATE POLICY "Admins and teachers can create channels" ON channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
      AND profiles.school_id = channels.school_id
      AND profiles.school_id IS NOT NULL
    )
  );

CREATE POLICY "Channel creators and admins can update channels" ON channels
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = channels.school_id
      AND profiles.school_id IS NOT NULL
    )
  );

CREATE POLICY "Channel creators and admins can delete channels" ON channels
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = channels.school_id
      AND profiles.school_id IS NOT NULL
    )
  );

-- Messages RLS Policies
CREATE POLICY "Users can view messages from their school channels" ON messages
  FOR SELECT USING (
    channel_id IN (
      SELECT channels.id FROM channels 
      INNER JOIN profiles ON profiles.school_id = channels.school_id
      WHERE profiles.id = auth.uid() 
      AND profiles.school_id IS NOT NULL
    )
  );

CREATE POLICY "Users can send messages to their school channels" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    channel_id IN (
      SELECT channels.id FROM channels 
      INNER JOIN profiles ON profiles.school_id = channels.school_id
      WHERE profiles.id = auth.uid() 
      AND profiles.school_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- Create function to check if tables exist
CREATE OR REPLACE FUNCTION check_messaging_tables()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'channels_exists', EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'channels'
    ),
    'messages_exists', EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'messages'
    ),
    'profiles_exists', EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
    ),
    'schools_exists', EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schools'
    ),
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's school info with better error handling
CREATE OR REPLACE FUNCTION get_user_school_info()
RETURNS json AS $$
DECLARE
  result json;
  user_id uuid;
BEGIN
  -- Get the authenticated user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('error', 'No authenticated user');
  END IF;
  
  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RETURN json_build_object('error', 'Profiles table does not exist');
  END IF;
  
  SELECT json_build_object(
    'user_id', user_id,
    'school_id', p.school_id,
    'role', p.role,
    'full_name', p.full_name,
    'has_school', p.school_id IS NOT NULL
  ) INTO result
  FROM profiles p
  WHERE p.id = user_id;
  
  RETURN COALESCE(result, json_build_object('error', 'User profile not found', 'user_id', user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create a general channel for a school with better error handling
CREATE OR REPLACE FUNCTION create_general_channel(school_uuid UUID)
RETURNS json AS $$
DECLARE
  new_channel channels%ROWTYPE;
  user_info json;
  user_id uuid;
BEGIN
  -- Get the authenticated user ID
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object('error', 'No authenticated user');
  END IF;
  
  -- Get user info
  SELECT get_user_school_info() INTO user_info;
  
  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RETURN json_build_object('error', 'Profiles table does not exist', 'user_info', user_info);
  END IF;
  
  -- Check if user exists and has proper permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'teacher')
    AND school_id = school_uuid
  ) THEN
    RETURN json_build_object(
      'error', 'Insufficient permissions to create channel or user not found in school',
      'user_info', user_info,
      'required_school_id', school_uuid
    );
  END IF;
  
  -- Check if General channel already exists for this school
  IF EXISTS (
    SELECT 1 FROM channels 
    WHERE school_id = school_uuid 
    AND LOWER(name) = 'general'
  ) THEN
    RETURN json_build_object(
      'error', 'General channel already exists for this school',
      'user_info', user_info
    );
  END IF;
  
  -- Create the channel
  INSERT INTO channels (name, school_id, created_by, is_private)
  VALUES ('General', school_uuid, user_id, false)
  RETURNING * INTO new_channel;
  
  RETURN json_build_object(
    'success', true,
    'channel', row_to_json(new_channel),
    'user_info', user_info
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'user_info', user_info,
      'detail', 'Error occurred during channel creation'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON channels TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT EXECUTE ON FUNCTION check_messaging_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_school_info() TO authenticated;
GRANT EXECUTE ON FUNCTION create_general_channel(UUID) TO authenticated;

-- Create a simple test function to verify everything works
CREATE OR REPLACE FUNCTION test_messaging_setup()
RETURNS json AS $$
DECLARE
  table_status json;
  user_info json;
BEGIN
  SELECT check_messaging_tables() INTO table_status;
  SELECT get_user_school_info() INTO user_info;
  
  RETURN json_build_object(
    'table_status', table_status,
    'user_info', user_info,
    'test_timestamp', NOW(),
    'message', 'Messaging system setup test completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_messaging_setup() TO authenticated;
