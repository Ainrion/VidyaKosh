-- Test Script for Automatic School Code Generation
-- Run this AFTER running auto_school_code_trigger.sql
-- This will test if the trigger works correctly

-- ========================================
-- 1. TEST TRIGGER WITH NEW SCHOOL
-- ========================================

-- Insert a test school without specifying school_code
-- The trigger should automatically generate one
INSERT INTO schools (name, address, phone, email)
VALUES (
  'Test School for Code Generation',
  '123 Test Street, Test City',
  '+1-555-TEST',
  'test@testschool.edu'
);

-- ========================================
-- 2. VERIFY THE TRIGGER WORKED
-- ========================================

-- Check if the test school got a code automatically
SELECT 
  'Test school created:' as info,
  id,
  name,
  school_code,
  created_at
FROM schools 
WHERE name = 'Test School for Code Generation';

-- ========================================
-- 3. TEST UNIQUENESS
-- ========================================

-- Check for any duplicate codes
SELECT 
  'Uniqueness check:' as info,
  school_code,
  COUNT(*) as count
FROM schools 
WHERE school_code IS NOT NULL
GROUP BY school_code
HAVING COUNT(*) > 1;

-- ========================================
-- 4. CLEAN UP TEST DATA
-- ========================================

-- Remove the test school (optional)
-- DELETE FROM schools WHERE name = 'Test School for Code Generation';

-- ========================================
-- 5. FINAL VERIFICATION
-- ========================================

-- Show all schools with their codes
SELECT 
  'All schools with unique codes:' as info,
  COUNT(*) as total_schools,
  COUNT(DISTINCT school_code) as unique_codes
FROM schools 
WHERE school_code IS NOT NULL;

-- Show recent schools
SELECT 
  'Recent schools:' as info,
  name,
  school_code,
  created_at
FROM schools 
ORDER BY created_at DESC 
LIMIT 5;
