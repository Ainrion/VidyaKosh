-- Fix for the generate_enrollment_code function error
-- This fixes the "missing FROM-clause entry" error

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS generate_enrollment_code();

-- Create the corrected function
CREATE OR REPLACE FUNCTION generate_enrollment_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists (FIXED: use distinct variable names to avoid ambiguity)
    SELECT EXISTS(SELECT 1 FROM course_enrollment_codes WHERE course_enrollment_codes.code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_enrollment_code() TO authenticated;

-- Test the function
SELECT 'Function fixed successfully!' as status;
SELECT generate_enrollment_code() as test_code;
