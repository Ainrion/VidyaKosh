-- Add school code system for teacher applications
-- Run this in your Supabase SQL Editor

-- Add school_code column to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS school_code TEXT UNIQUE;

-- Generate school codes for existing schools
UPDATE schools 
SET school_code = upper(substring(md5(random()::text) from 1 for 8))
WHERE school_code IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);

-- Create function to generate unique school codes
CREATE OR REPLACE FUNCTION generate_school_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM schools WHERE school_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get school by code
CREATE OR REPLACE FUNCTION get_school_by_code(code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  school_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.address, s.phone, s.email, s.school_code
  FROM schools s
  WHERE s.school_code = code;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT 'School code system added successfully!' as status;
SELECT 'Generated codes for existing schools:' as info;
SELECT id, name, school_code FROM schools ORDER BY created_at;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_school_code() TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_by_code(TEXT) TO authenticated;
