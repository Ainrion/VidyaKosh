-- Complete School Code Setup for Vidyakosh LMS
-- Run this entire script in your Supabase SQL Editor

-- ========================================
-- 1. ADD SCHOOL CODE COLUMN
-- ========================================

-- Add school_code column to schools table if it doesn't exist
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS school_code TEXT UNIQUE;

-- ========================================
-- 2. GENERATE UNIQUE SCHOOL CODES
-- ========================================

-- Create function to generate unique school codes
CREATE OR REPLACE FUNCTION generate_school_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase)
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

-- ========================================
-- 3. ASSIGN CODES TO EXISTING SCHOOLS
-- ========================================

-- Update existing schools that don't have codes
UPDATE schools 
SET school_code = generate_school_code()
WHERE school_code IS NULL;

-- ========================================
-- 4. CREATE INDEX FOR PERFORMANCE
-- ========================================

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);

-- ========================================
-- 5. CREATE HELPER FUNCTIONS
-- ========================================

-- Function to get school by code
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

-- Function to regenerate school code (for admin use)
CREATE OR REPLACE FUNCTION regenerate_school_code(school_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate new unique code
  new_code := generate_school_code();
  
  -- Update the school with new code
  UPDATE schools 
  SET school_code = new_code
  WHERE id = school_uuid;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. VERIFY UNIQUENESS
-- ========================================

-- Check for duplicate codes (should return 0)
SELECT 
  'Duplicate codes check:' as info,
  COUNT(*) - COUNT(DISTINCT school_code) as duplicate_count
FROM schools 
WHERE school_code IS NOT NULL;

-- Show all schools with their codes
SELECT 
  'Schools with codes:' as info,
  id,
  name,
  school_code,
  created_at
FROM schools 
ORDER BY created_at;

-- ========================================
-- 7. GRANT PERMISSIONS
-- ========================================

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_school_code() TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_school_code(UUID) TO authenticated;

-- ========================================
-- 8. SUCCESS VERIFICATION
-- ========================================

-- Final verification
SELECT '✅ School code setup completed successfully!' as status;
SELECT 'All schools now have unique codes' as message;
SELECT 'Functions created: generate_school_code(), get_school_by_code(), regenerate_school_code()' as functions;
SELECT 'Index created: idx_schools_school_code' as indexes;

-- Show sample of generated codes
SELECT 
  'Sample school codes:' as info,
  name,
  school_code
FROM schools 
LIMIT 5;
