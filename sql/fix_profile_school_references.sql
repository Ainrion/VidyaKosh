-- Fix Profile School References
-- This script fixes profiles that have invalid school_id references
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. ANALYZE THE PROBLEM
-- ========================================

SELECT 'Profile school reference analysis:' as info;

SELECT 
  'Total profiles:' as metric, COUNT(*)::text as value FROM profiles
UNION ALL
SELECT 'Profiles with NULL school_id:' as metric, COUNT(*)::text as value 
FROM profiles WHERE school_id IS NULL
UNION ALL
SELECT 'Profiles with invalid school_id:' as metric, COUNT(*)::text as value 
FROM profiles p WHERE p.school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = p.school_id)
UNION ALL
SELECT 'Profiles with valid school_id:' as metric, COUNT(*)::text as value 
FROM profiles p WHERE p.school_id IS NOT NULL AND EXISTS (SELECT 1 FROM schools s WHERE s.id = p.school_id);

-- ========================================
-- 2. SHOW PROFILES WITH INVALID SCHOOL_ID
-- ========================================

SELECT 'Profiles with invalid school_id:' as info;
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.school_id,
  p.created_at
FROM profiles p
WHERE p.school_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = p.school_id)
ORDER BY p.created_at DESC;

-- ========================================
-- 3. SHOW PROFILES WITH NULL SCHOOL_ID
-- ========================================

SELECT 'Profiles with NULL school_id:' as info;
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.school_id,
  p.created_at
FROM profiles p
WHERE p.school_id IS NULL
ORDER BY p.created_at DESC;

-- ========================================
-- 4. SHOW AVAILABLE SCHOOLS
-- ========================================

SELECT 'Available schools:' as info;
SELECT 
  s.id,
  s.name,
  s.email,
  COUNT(p.id) as profile_count
FROM schools s
LEFT JOIN profiles p ON s.id = p.school_id
GROUP BY s.id, s.name, s.email
ORDER BY s.name;

-- ========================================
-- 5. CREATE DEFAULT SCHOOL IF NEEDED
-- ========================================

-- Ensure a default school exists
DO $$
DECLARE
  default_school_id UUID;
BEGIN
  -- Try to get existing default school
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
END $$;

-- ========================================
-- 6. FIX INVALID SCHOOL_ID REFERENCES
-- ========================================

-- Update profiles with invalid school_id to use default school
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- Update profiles with invalid school_id
  UPDATE profiles 
  SET school_id = default_school_id
  WHERE school_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM schools WHERE id = profiles.school_id);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % profiles with invalid school_id to use default school', updated_count;
END $$;

-- ========================================
-- 7. FIX NULL SCHOOL_ID REFERENCES
-- ========================================

-- Update profiles with NULL school_id to use default school
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
-- 8. VERIFY THE FIX
-- ========================================

SELECT 'Verification after fix:' as info;

SELECT 
  'Total profiles:' as metric, COUNT(*)::text as value FROM profiles
UNION ALL
SELECT 'Profiles with NULL school_id:' as metric, COUNT(*)::text as value 
FROM profiles WHERE school_id IS NULL
UNION ALL
SELECT 'Profiles with invalid school_id:' as metric, COUNT(*)::text as value 
FROM profiles p WHERE p.school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = p.school_id)
UNION ALL
SELECT 'Profiles with valid school_id:' as metric, COUNT(*)::text as value 
FROM profiles p WHERE p.school_id IS NOT NULL AND EXISTS (SELECT 1 FROM schools s WHERE s.id = p.school_id);

-- ========================================
-- 9. SHOW PROFILE DISTRIBUTION BY SCHOOL
-- ========================================

SELECT 'Profile distribution by school:' as info;
SELECT 
  s.name as school_name,
  COUNT(p.id) as profile_count,
  COUNT(CASE WHEN p.role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN p.role = 'teacher' THEN 1 END) as teachers,
  COUNT(CASE WHEN p.role = 'student' THEN 1 END) as students
FROM schools s
LEFT JOIN profiles p ON s.id = p.school_id
GROUP BY s.id, s.name
ORDER BY profile_count DESC;

-- ========================================
-- 10. FINAL SUMMARY
-- ========================================

SELECT '✅ Profile school references fixed!' as status;
SELECT 'All profiles now have valid school_id references.' as result;
SELECT 'The profile page should now load without errors.' as next_step;
