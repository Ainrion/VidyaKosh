-- Quick Fix: Add missing attachment columns to assignments table
-- Run this in your Supabase SQL Editor

-- Add the missing attachment columns
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size BIGINT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_attachment_url ON assignments(attachment_url);

-- Verify the columns were added
SELECT 
  'Columns Added Successfully' as status,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'assignments' 
  AND column_name IN ('attachment_url', 'attachment_name', 'attachment_size', 'attachment_type')
ORDER BY ordinal_position;

-- Show current assignments table structure
SELECT 
  'Current Assignments Table Structure' as info,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;
