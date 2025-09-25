-- Complete Blackboards Table Setup
-- This ensures the blackboards table exists with proper RLS policies

-- Create blackboards table if it doesn't exist
CREATE TABLE IF NOT EXISTS blackboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT,
  board_state JSONB, -- Store strokes, elements, etc.
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on blackboards table
ALTER TABLE blackboards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view school blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can create blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can update blackboards" ON blackboards;
DROP POLICY IF EXISTS "Teachers can delete blackboards" ON blackboards;
DROP POLICY IF EXISTS "Service role can manage blackboards" ON blackboards;

-- Create RLS Policies for blackboards table

-- Users can view blackboards for courses in their school
CREATE POLICY "Users can view school blackboards" ON blackboards
FOR SELECT USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid()
  )
);

-- Teachers and admins can create blackboards for courses in their school
CREATE POLICY "Teachers can create blackboards" ON blackboards
FOR INSERT WITH CHECK (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Teachers and admins can update blackboards for courses in their school
CREATE POLICY "Teachers can update blackboards" ON blackboards
FOR UPDATE USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Teachers and admins can delete blackboards for courses in their school
CREATE POLICY "Teachers can delete blackboards" ON blackboards
FOR DELETE USING (
  course_id IN (
    SELECT c.id FROM courses c
    JOIN profiles p ON p.school_id = c.school_id
    WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
  )
);

-- Allow service role to manage blackboards (for API operations)
CREATE POLICY "Service role can manage blackboards" ON blackboards
FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON blackboards TO authenticated;
GRANT ALL ON blackboards TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blackboards_course_id ON blackboards(course_id);
CREATE INDEX IF NOT EXISTS idx_blackboards_updated_at ON blackboards(updated_at);

-- Test the setup
DO $$
BEGIN
  RAISE NOTICE 'Blackboards table setup completed successfully';
  RAISE NOTICE 'Table exists: %', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blackboards');
  RAISE NOTICE 'RLS enabled: %', EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'blackboards' AND c.relrowsecurity = true
  );
END $$;
