-- Check Schools Table Structure and Data
-- This will help identify any issues with the schools table

-- ========================================
-- 1. CHECK IF SCHOOLS TABLE EXISTS
-- ========================================

SELECT 'Schools table structure check:' as info;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'schools' 
ORDER BY ordinal_position;

-- ========================================
-- 2. CHECK SCHOOLS TABLE DATA
-- ========================================

SELECT 'Schools table data:' as info;
SELECT 
  id,
  name,
  email,
  address,
  phone,
  created_at
FROM schools
ORDER BY created_at;

-- ========================================
-- 3. CHECK FOR FOREIGN KEY CONSTRAINTS
-- ========================================

SELECT 'Foreign key constraints referencing schools table:' as info;
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'schools'
ORDER BY tc.table_name, tc.constraint_name;

-- ========================================
-- 4. CHECK TABLES THAT SHOULD HAVE SCHOOL_ID
-- ========================================

SELECT 'Tables with school_id columns:' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE column_name = 'school_id'
ORDER BY table_name;

-- ========================================
-- 5. CHECK FOR INVALID SCHOOL_ID REFERENCES
-- ========================================

SELECT 'Invalid school_id references by table:' as info;

-- Check profiles table
SELECT 
  'profiles' as table_name,
  COUNT(*) as invalid_count
FROM profiles p
WHERE p.school_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = p.school_id)

UNION ALL

-- Check courses table
SELECT 
  'courses' as table_name,
  COUNT(*) as invalid_count
FROM courses c
WHERE c.school_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = c.school_id)

UNION ALL

-- Check exams table
SELECT 
  'exams' as table_name,
  COUNT(*) as invalid_count
FROM exams e
WHERE e.school_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = e.school_id)

UNION ALL

-- Check assignments table
SELECT 
  'assignments' as table_name,
  COUNT(*) as invalid_count
FROM assignments a
WHERE a.school_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = a.school_id);

-- ========================================
-- 6. SUMMARY
-- ========================================

SELECT 'Summary:' as info;
SELECT 
  'Total schools:' as metric, COUNT(*)::text as value FROM schools
UNION ALL
SELECT 'Total profiles:' as metric, COUNT(*)::text as value FROM profiles
UNION ALL
SELECT 'Total courses:' as metric, COUNT(*)::text as value FROM courses
UNION ALL
SELECT 'Profiles with NULL school_id:' as metric, COUNT(*)::text as value 
FROM profiles WHERE school_id IS NULL
UNION ALL
SELECT 'Courses with NULL school_id:' as metric, COUNT(*)::text as value 
FROM courses WHERE school_id IS NULL;
