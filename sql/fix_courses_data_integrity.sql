-- Fix Courses Data Integrity Issue
-- This will fix the 36 courses with invalid school_id references
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. FIRST, LET'S SEE THE PROBLEM
-- ========================================

SELECT 'Courses with invalid school_id (before fix):' as info;
SELECT 
  c.id,
  c.title,
  c.school_id as invalid_school_id,
  c.created_by,
  c.created_at
FROM courses c
LEFT JOIN schools s ON c.school_id = s.id
WHERE s.id IS NULL
ORDER BY c.created_at DESC;

-- ========================================
-- 2. GET THE DEFAULT SCHOOL ID
-- ========================================

-- Get the default school ID (should be the one created during migration)
DO $$
DECLARE
  default_school_id UUID;
  invalid_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- If no default school exists, create one
  IF default_school_id IS NULL THEN
    INSERT INTO schools (id, name, address, email, phone, created_at)
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'Default School',
      'Default Address',
      'admin@defaultschool.edu',
      '+1-555-0123',
      now()
    )
    RETURNING id INTO default_school_id;
    
    RAISE NOTICE 'Created default school with ID: %', default_school_id;
  ELSE
    RAISE NOTICE 'Using existing default school with ID: %', default_school_id;
  END IF;
  
  -- Count invalid courses
  SELECT COUNT(*) INTO invalid_count
  FROM courses c
  LEFT JOIN schools s ON c.school_id = s.id
  WHERE s.id IS NULL;
  
  RAISE NOTICE 'Found % courses with invalid school_id references', invalid_count;
END $$;

-- ========================================
-- 3. FIX THE INVALID SCHOOL_ID REFERENCES
-- ========================================

-- Update courses with invalid school_id to use the default school
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- Update courses with invalid school_id
  UPDATE courses 
  SET school_id = default_school_id
  WHERE school_id IS NOT NULL 
  AND school_id NOT IN (SELECT id FROM schools);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % courses with invalid school_id to use default school', updated_count;
END $$;

-- ========================================
-- 4. UPDATE COURSES WITH NULL SCHOOL_ID
-- ========================================

-- Update courses with NULL school_id to use the default school
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- Update courses with NULL school_id
  UPDATE courses 
  SET school_id = default_school_id
  WHERE school_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % courses with NULL school_id to use default school', updated_count;
END $$;

-- ========================================
-- 5. UPDATE PROFILES WITH NULL SCHOOL_ID
-- ========================================

-- Update profiles with NULL school_id to use the default school
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- Update profiles with NULL school_id
  UPDATE profiles 
  SET school_id = default_school_id
  WHERE school_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % profiles with NULL school_id to use default school', updated_count;
END $$;

-- ========================================
-- 6. VERIFY THE FIX
-- ========================================

SELECT 'Courses with invalid school_id (after fix):' as info;
SELECT 
  c.id,
  c.title,
  c.school_id,
  s.name as school_name,
  CASE 
    WHEN s.id IS NULL THEN 'STILL INVALID'
    ELSE 'FIXED'
  END as status
FROM courses c
LEFT JOIN schools s ON c.school_id = s.id
ORDER BY status DESC, c.created_at DESC;

-- ========================================
-- 7. FINAL SUMMARY
-- ========================================

SELECT 'FINAL SUMMARY AFTER FIX:' as info;

SELECT 'Total courses:' as metric, COUNT(*)::text as value FROM courses
UNION ALL
SELECT 'Total schools:' as metric, COUNT(*)::text as value FROM schools
UNION ALL
SELECT 'Total profiles:' as metric, COUNT(*)::text as value FROM profiles
UNION ALL
SELECT 'Total enrollments:' as metric, COUNT(*)::text as value FROM enrollments
UNION ALL
SELECT 'Courses with invalid school_id:' as metric, COUNT(*)::text as value 
FROM courses c LEFT JOIN schools s ON c.school_id = s.id WHERE s.id IS NULL
UNION ALL
SELECT 'Courses with invalid created_by:' as metric, COUNT(*)::text as value 
FROM courses c LEFT JOIN profiles p ON c.created_by = p.id WHERE p.id IS NULL
UNION ALL
SELECT 'Profiles with invalid school_id:' as metric, COUNT(*)::text as value 
FROM profiles p LEFT JOIN schools s ON p.school_id = s.id WHERE s.id IS NULL;

-- ========================================
-- 8. SHOW COURSES BY SCHOOL
-- ========================================

SELECT 'Courses distribution by school:' as info;
SELECT 
  s.name as school_name,
  COUNT(c.id) as course_count,
  COUNT(p.id) as profile_count
FROM schools s
LEFT JOIN courses c ON s.id = c.school_id
LEFT JOIN profiles p ON s.id = p.school_id
GROUP BY s.id, s.name
ORDER BY course_count DESC;

SELECT '✅ Data integrity fix completed!' as status;
SELECT 'All courses now have valid school_id references.' as result;
SELECT 'The frontend should now properly filter courses by school.' as next_step;
