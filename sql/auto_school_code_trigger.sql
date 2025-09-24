-- Automatic School Code Generation Trigger
-- This ensures every new school gets a unique code automatically
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. ENSURE SCHOOL CODE COLUMN EXISTS
-- ========================================

-- Add school_code column to schools table if it doesn't exist
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS school_code TEXT UNIQUE;

-- ========================================
-- 2. CREATE UNIQUE CODE GENERATION FUNCTION
-- ========================================

-- Create or replace function to generate unique school codes
CREATE OR REPLACE FUNCTION generate_unique_school_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    attempts := attempts + 1;
    
    -- Generate 8-character alphanumeric code (uppercase)
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM schools WHERE school_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
    
    -- Safety check to prevent infinite loops
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique school code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. CREATE TRIGGER FUNCTION
-- ========================================

-- Create trigger function that runs when a new school is inserted
CREATE OR REPLACE FUNCTION auto_generate_school_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate code if school_code is NULL or empty
  IF NEW.school_code IS NULL OR NEW.school_code = '' THEN
    NEW.school_code := generate_unique_school_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. CREATE THE TRIGGER
-- ========================================

-- Drop trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_auto_generate_school_code ON schools;

-- Create the trigger that fires before INSERT
CREATE TRIGGER trigger_auto_generate_school_code
  BEFORE INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_school_code();

-- ========================================
-- 5. GENERATE CODES FOR EXISTING SCHOOLS
-- ========================================

-- Generate codes for any existing schools that don't have them
UPDATE schools 
SET school_code = generate_unique_school_code()
WHERE school_code IS NULL OR school_code = '';

-- ========================================
-- 6. CREATE INDEX FOR PERFORMANCE
-- ========================================

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);

-- ========================================
-- 7. HELPER FUNCTIONS
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
  new_code := generate_unique_school_code();
  
  -- Update the school with new code
  UPDATE schools 
  SET school_code = new_code
  WHERE id = school_uuid;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_unique_school_code() TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_school_code(UUID) TO authenticated;

-- ========================================
-- 9. VERIFICATION
-- ========================================

-- Check for duplicate codes (should return 0)
SELECT 
  'Duplicate codes check:' as info,
  COUNT(*) - COUNT(DISTINCT school_code) as duplicate_count
FROM schools 
WHERE school_code IS NOT NULL;

-- Show all schools with their codes
SELECT 
  'All schools with codes:' as info,
  id,
  name,
  school_code,
  created_at
FROM schools 
ORDER BY created_at;

-- ========================================
-- 10. SUCCESS MESSAGE
-- ========================================

SELECT '✅ Automatic school code generation setup completed!' as status;
SELECT 'Every new school will now automatically get a unique code' as message;
SELECT 'Trigger created: trigger_auto_generate_school_code' as trigger_info;
SELECT 'Function created: generate_unique_school_code()' as function_info;
