-- Fix Messaging System Database Schema
-- This script creates all necessary tables and functions for the messaging system

-- Create channels table
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

-- Channels RLS Policies
CREATE POLICY "Users can view channels from their school" ON channels
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid() AND school_id IS NOT NULL
    )
  );

CREATE POLICY "Admins and teachers can create channels" ON channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'teacher')
      AND school_id = channels.school_id
    )
  );

CREATE POLICY "Channel creators and admins can update channels" ON channels
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND school_id = channels.school_id
    )
  );

CREATE POLICY "Channel creators and admins can delete channels" ON channels
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND school_id = channels.school_id
    )
  );

-- Messages RLS Policies
CREATE POLICY "Users can view messages from their school channels" ON messages
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM channels 
      WHERE school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid() AND school_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can send messages to their school channels" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    channel_id IN (
      SELECT id FROM channels 
      WHERE school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid() AND school_id IS NOT NULL
      )
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
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's school info
CREATE OR REPLACE FUNCTION get_user_school_info()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'user_id', auth.uid(),
    'school_id', p.school_id,
    'role', p.role,
    'full_name', p.full_name
  ) INTO result
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN COALESCE(result, json_build_object('error', 'User not found'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create a general channel for a school
CREATE OR REPLACE FUNCTION create_general_channel(school_uuid UUID)
RETURNS json AS $$
DECLARE
  new_channel channels%ROWTYPE;
  user_info json;
BEGIN
  -- Get user info
  SELECT get_user_school_info() INTO user_info;
  
  -- Check if user is admin or teacher
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'teacher')
    AND school_id = school_uuid
  ) THEN
    RETURN json_build_object('error', 'Insufficient permissions to create channel');
  END IF;
  
  -- Create the channel
  INSERT INTO channels (name, school_id, created_by, is_private)
  VALUES ('General', school_uuid, auth.uid(), false)
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
      'user_info', user_info
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
