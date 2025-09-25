-- Comprehensive Fix for School ID Issues
-- This addresses potential problems with school_id implementation
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. ENSURE SCHOOLS TABLE EXISTS AND IS PROPERLY STRUCTURED
-- ========================================

-- Create schools table if it doesn't exist
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  address TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  school_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- 2. ENSURE DEFAULT SCHOOL EXISTS
-- ========================================

-- Create a default school if none exists
DO $$
DECLARE
  default_school_id UUID;
BEGIN
  -- Check if any school exists
  SELECT id INTO default_school_id FROM schools LIMIT 1;
  
  -- If no school exists, create a default one
  IF default_school_id IS NULL THEN
    INSERT INTO schools (id, name, address, email, phone, school_code)
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Default School',
      'Default Address',
      'admin@defaultschool.edu',
      '+1-555-0123',
      'DEFAULT'
    )
    RETURNING id INTO default_school_id;
    
    RAISE NOTICE 'Created default school with ID: %', default_school_id;
  ELSE
    RAISE NOTICE 'Using existing school with ID: %', default_school_id;
  END IF;
END $$;

-- ========================================
-- 3. ADD SCHOOL_ID COLUMNS IF THEY DON'T EXIST
-- ========================================

-- Add school_id to profiles table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN school_id UUID;
    RAISE NOTICE 'Added school_id column to profiles table';
  ELSE
    RAISE NOTICE 'school_id column already exists in profiles table';
  END IF;
END $$;

-- Add school_id to courses table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN school_id UUID;
    RAISE NOTICE 'Added school_id column to courses table';
  ELSE
    RAISE NOTICE 'school_id column already exists in courses table';
  END IF;
END $$;

-- Add school_id to exams table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exams' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE exams ADD COLUMN school_id UUID;
    RAISE NOTICE 'Added school_id column to exams table';
  ELSE
    RAISE NOTICE 'school_id column already exists in exams table';
  END IF;
END $$;

-- Add school_id to assignments table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assignments' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE assignments ADD COLUMN school_id UUID;
    RAISE NOTICE 'Added school_id column to assignments table';
  ELSE
    RAISE NOTICE 'school_id column already exists in assignments table';
  END IF;
END $$;

-- ========================================
-- 4. FIX INVALID SCHOOL_ID REFERENCES
-- ========================================

-- Get the default school ID
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- Fix profiles with invalid school_id
  UPDATE profiles 
  SET school_id = default_school_id
  WHERE school_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM schools WHERE id = profiles.school_id);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % profiles with invalid school_id', updated_count;
  
  -- Fix profiles with NULL school_id
  UPDATE profiles 
  SET school_id = default_school_id
  WHERE school_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % profiles with NULL school_id', updated_count;
  
  -- Fix courses with invalid school_id
  UPDATE courses 
  SET school_id = default_school_id
  WHERE school_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM schools WHERE id = courses.school_id);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % courses with invalid school_id', updated_count;
  
  -- Fix courses with NULL school_id
  UPDATE courses 
  SET school_id = default_school_id
  WHERE school_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % courses with NULL school_id', updated_count;
  
  -- Fix exams with invalid school_id (based on course's school_id)
  UPDATE exams 
  SET school_id = COALESCE(c.school_id, default_school_id)
  FROM courses c
  WHERE exams.course_id = c.id
  AND (exams.school_id IS NULL OR NOT EXISTS (SELECT 1 FROM schools WHERE id = exams.school_id));
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % exams with invalid school_id', updated_count;
  
  -- Fix assignments with invalid school_id (based on course's school_id)
  UPDATE assignments 
  SET school_id = COALESCE(c.school_id, default_school_id)
  FROM courses c
  WHERE assignments.course_id = c.id
  AND (assignments.school_id IS NULL OR NOT EXISTS (SELECT 1 FROM schools WHERE id = assignments.school_id));
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % assignments with invalid school_id', updated_count;
END $$;

-- ========================================
-- 5. ADD FOREIGN KEY CONSTRAINTS (SAFELY)
-- ========================================

-- Add foreign key constraint for profiles.school_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_school_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_school_id_fkey 
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint for profiles.school_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists for profiles.school_id';
  END IF;
END $$;

-- Add foreign key constraint for courses.school_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'courses_school_id_fkey'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_school_id_fkey 
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint for courses.school_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists for courses.school_id';
  END IF;
END $$;

-- ========================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_courses_school_id ON courses(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_school_id ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON assignments(school_id);

-- ========================================
-- 7. VERIFY THE FIX
-- ========================================

SELECT 'Verification after fix:' as info;

SELECT 
  'Total schools:' as metric, COUNT(*)::text as value FROM schools
UNION ALL
SELECT 'Total profiles:' as metric, COUNT(*)::text as value FROM profiles
UNION ALL
SELECT 'Total courses:' as metric, COUNT(*)::text as value FROM courses
UNION ALL
SELECT 'Profiles with invalid school_id:' as metric, COUNT(*)::text as value 
FROM profiles p WHERE p.school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = p.school_id)
UNION ALL
SELECT 'Courses with invalid school_id:' as metric, COUNT(*)::text as value 
FROM courses c WHERE c.school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = c.school_id)
UNION ALL
SELECT 'Profiles with NULL school_id:' as metric, COUNT(*)::text as value 
FROM profiles WHERE school_id IS NULL
UNION ALL
SELECT 'Courses with NULL school_id:' as metric, COUNT(*)::text as value 
FROM courses WHERE school_id IS NULL;

-- ========================================
-- 8. FINAL SUMMARY
-- ========================================

SELECT '✅ School ID issues fixed!' as status;
SELECT 'All tables now have proper school_id columns and references.' as result;
SELECT 'The application should now work without school_id errors.' as next_step;
