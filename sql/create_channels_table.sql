-- Create channels table if it doesn't exist
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channels_school_id ON channels(school_id);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channels_course_id ON channels(course_id);

-- Create RLS policies
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view channels from their school
CREATE POLICY "Users can view channels from their school" ON channels
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Admins can create channels
CREATE POLICY "Admins can create channels" ON channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND school_id = channels.school_id
    )
  );

-- Policy: Channel creators can update their channels
CREATE POLICY "Channel creators can update their channels" ON channels
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Policy: Channel creators can delete their channels
CREATE POLICY "Channel creators can delete their channels" ON channels
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- Create function to create channels table if not exists
CREATE OR REPLACE FUNCTION create_channels_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since the table creation is done above
  -- The actual table creation happens at the schema level
  RETURN;
END;
$$ LANGUAGE plpgsql;
