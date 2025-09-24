-- Fix assignments table to add missing created_by column
-- Run this in your Supabase SQL Editor

-- Add created_by column to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_course_created_by ON assignments(course_id, created_by);

-- Update existing assignments to have created_by (optional - for existing data)
-- This will set created_by to the course creator for existing assignments
UPDATE assignments 
SET created_by = c.created_by
FROM courses c
WHERE assignments.course_id = c.id 
  AND assignments.created_by IS NULL;

-- Verify the changes
SELECT 
  'Assignments Table Fixed' as status,
  COUNT(*) as total_assignments,
  COUNT(created_by) as assignments_with_creator
FROM assignments;

-- Show sample of updated assignments
SELECT 
  id,
  title,
  course_id,
  created_by,
  created_at
FROM assignments 
ORDER BY created_at DESC
LIMIT 5;
