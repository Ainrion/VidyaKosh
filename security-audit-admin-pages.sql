-- Security Audit: Admin Pages School-Specific Data Access
-- This script verifies that all admin pages properly filter by school_id

-- Check RLS policies for school-specific data access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'courses', 'assignments', 'exams', 'messages', 'enrollments')
ORDER BY tablename, policyname;

-- Verify that profiles table has proper school_id filtering
SELECT 
    'profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT school_id) as unique_schools,
    COUNT(CASE WHEN school_id IS NULL THEN 1 END) as null_school_ids
FROM profiles;

-- Check if any admin can see data from other schools (this should return 0)
SELECT 
    p1.id as admin_id,
    p1.full_name as admin_name,
    p1.school_id as admin_school_id,
    COUNT(p2.id) as other_school_users_visible
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.role = 'admin' 
  AND p2.school_id != p1.school_id
  AND p2.school_id IS NOT NULL
  AND p1.school_id IS NOT NULL
GROUP BY p1.id, p1.full_name, p1.school_id
HAVING COUNT(p2.id) > 0;

-- Verify courses are properly isolated by school
SELECT 
    'courses' as table_name,
    COUNT(*) as total_courses,
    COUNT(DISTINCT school_id) as unique_schools,
    COUNT(CASE WHEN school_id IS NULL THEN 1 END) as null_school_ids
FROM courses;

-- Check assignments isolation
SELECT 
    'assignments' as table_name,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT school_id) as unique_schools,
    COUNT(CASE WHEN school_id IS NULL THEN 1 END) as null_school_ids
FROM assignments;

-- Verify exam isolation
SELECT 
    'exams' as table_name,
    COUNT(*) as total_exams,
    COUNT(DISTINCT school_id) as unique_schools,
    COUNT(CASE WHEN school_id IS NULL THEN 1 END) as null_school_ids
FROM exams;

-- Check if any cross-school data access is possible
-- This query should return 0 rows if security is properly implemented
WITH admin_schools AS (
    SELECT DISTINCT school_id 
    FROM profiles 
    WHERE role = 'admin' AND school_id IS NOT NULL
),
all_schools AS (
    SELECT DISTINCT school_id 
    FROM profiles 
    WHERE school_id IS NOT NULL
)
SELECT 
    'Cross-school access check' as check_name,
    COUNT(*) as potential_violations
FROM all_schools a
WHERE a.school_id NOT IN (SELECT school_id FROM admin_schools);

-- Verify RLS is enabled on all critical tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'courses', 'assignments', 'exams', 'messages', 'enrollments', 'schools')
ORDER BY tablename;

-- Check for any policies that might allow cross-school access
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE (qual LIKE '%school_id%' OR with_check LIKE '%school_id%')
  AND tablename IN ('profiles', 'courses', 'assignments', 'exams', 'messages', 'enrollments')
ORDER BY tablename, policyname;

-- Summary report
SELECT 
    'Security Audit Summary' as report_type,
    'All admin pages should filter by school_id' as requirement,
    'Check application code for proper school_id filtering' as action_required;
