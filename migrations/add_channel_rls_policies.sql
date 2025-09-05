-- Add missing RLS policies for channels table
-- This file should be run in your Supabase SQL editor

-- Policy for viewing channels
CREATE POLICY "Users can view channels in their school" ON channels
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy for creating channels (admin only)
CREATE POLICY "Admins can create channels" ON channels
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for updating channels (admin only)
CREATE POLICY "Admins can update channels" ON channels
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for deleting channels (admin only)
CREATE POLICY "Admins can delete channels" ON channels
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Also add missing policies for channel_members table
CREATE POLICY "Users can view channel memberships in their school" ON channel_members
  FOR SELECT USING (
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage channel memberships" ON channel_members
  FOR ALL USING (
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN profiles p ON p.school_id = c.school_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
