-- Cleanup Duplicate and Invalid Courses
-- This will remove duplicate courses and fix data integrity issues
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. ANALYZE THE DUPLICATE PROBLEM
-- ========================================

SELECT 'Duplicate courses analysis:' as info;
SELECT 
  title,
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created,
  STRING_AGG(id::text, ', ') as course_ids
FROM courses
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ========================================
-- 2. SHOW ALL COURSES WITH DETAILS
-- ========================================

SELECT 'All courses with school and creator info:' as info;
SELECT 
  c.id,
  c.title,
  c.school_id,
  s.name as school_name,
  c.created_by,
  p.full_name as creator_name,
  c.created_at,
  CASE 
    WHEN s.id IS NULL THEN 'INVALID SCHOOL'
    ELSE 'VALID'
  END as school_status
FROM courses c
LEFT JOIN schools s ON c.school_id = s.id
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY c.created_at DESC;

-- ========================================
-- 3. IDENTIFY COURSES TO KEEP (KEEP THE LATEST)
-- ========================================

-- Create a temporary table to identify which courses to keep
CREATE TEMP TABLE courses_to_keep AS
SELECT DISTINCT ON (title) 
  id,
  title,
  school_id,
  created_by,
  created_at
FROM courses
ORDER BY title, created_at DESC;

-- ========================================
-- 4. SHOW WHICH COURSES WILL BE KEPT
-- ========================================

SELECT 'Courses that will be KEPT (latest of each title):' as info;
SELECT 
  c.id,
  c.title,
  c.school_id,
  s.name as school_name,
  c.created_by,
  p.full_name as creator_name,
  c.created_at
FROM courses_to_keep c
LEFT JOIN schools s ON c.school_id = s.id
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY c.created_at DESC;

-- ========================================
-- 5. SHOW WHICH COURSES WILL BE DELETED
-- ========================================

SELECT 'Courses that will be DELETED (duplicates):' as info;
SELECT 
  c.id,
  c.title,
  c.school_id,
  s.name as school_name,
  c.created_by,
  p.full_name as creator_name,
  c.created_at
FROM courses c
LEFT JOIN schools s ON c.school_id = s.id
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.id NOT IN (SELECT id FROM courses_to_keep)
ORDER BY c.title, c.created_at;

-- ========================================
-- 6. DELETE DUPLICATE COURSES (KEEP LATEST)
-- ========================================

-- Delete duplicate courses, keeping only the latest one of each title
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM courses 
  WHERE id NOT IN (SELECT id FROM courses_to_keep);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % duplicate courses', deleted_count;
END $$;

-- ========================================
-- 7. FIX REMAINING COURSES WITH INVALID SCHOOL_ID
-- ========================================

-- Get or create default school
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
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
  END IF;
  
  -- Update courses with invalid school_id
  UPDATE courses 
  SET school_id = default_school_id
  WHERE school_id IS NOT NULL 
  AND school_id NOT IN (SELECT id FROM schools);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % courses with invalid school_id to use default school', updated_count;
END $$;

-- ========================================
-- 8. UPDATE NULL SCHOOL_ID REFERENCES
-- ========================================

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
-- 9. CLEAN UP ORPHANED ENROLLMENTS
-- ========================================

-- Delete enrollments for courses that no longer exist
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM enrollments 
  WHERE course_id NOT IN (SELECT id FROM courses);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % orphaned enrollments', deleted_count;
END $$;

-- ========================================
-- 10. FINAL VERIFICATION
-- ========================================

SELECT 'FINAL COURSES AFTER CLEANUP:' as info;
SELECT 
  c.id,
  c.title,
  c.school_id,
  s.name as school_name,
  c.created_by,
  p.full_name as creator_name,
  c.created_at,
  CASE 
    WHEN s.id IS NULL THEN 'STILL INVALID'
    ELSE 'VALID'
  END as school_status
FROM courses c
LEFT JOIN schools s ON c.school_id = s.id
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY c.created_at DESC;

-- ========================================
-- 11. FINAL SUMMARY
-- ========================================

SELECT 'FINAL SUMMARY AFTER CLEANUP:' as info;

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
SELECT 'Orphaned enrollments:' as metric, COUNT(*)::text as value 
FROM enrollments e LEFT JOIN courses c ON e.course_id = c.id WHERE c.id IS NULL;

-- ========================================
-- 12. COURSE DISTRIBUTION BY SCHOOL
-- ========================================

SELECT 'Course distribution by school:' as info;
SELECT 
  s.name as school_name,
  COUNT(c.id) as course_count
FROM schools s
LEFT JOIN courses c ON s.id = c.school_id
GROUP BY s.id, s.name
ORDER BY course_count DESC;

-- Clean up temporary table
DROP TABLE IF EXISTS courses_to_keep;

SELECT '✅ Course cleanup completed!' as status;
SELECT 'Duplicate courses removed, data integrity fixed.' as result;
SELECT 'The frontend should now show only valid, unique courses.' as next_step;
