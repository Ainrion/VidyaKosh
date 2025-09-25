-- Fix exam visibility issues
-- This script addresses the main issues preventing students from seeing exams

-- 1. Fix the existing exam to be published and have correct school_id
UPDATE exams 
SET 
  is_published = true,
  school_id = c.school_id
FROM courses c
WHERE exams.course_id = c.id
AND exams.id = '433580b6-141a-4451-beed-d0069e4fd464';

-- 2. Fix any other exams that might have similar issues
UPDATE exams 
SET 
  is_published = true,
  school_id = c.school_id
FROM courses c
WHERE exams.course_id = c.id
AND (exams.is_published = false OR exams.school_id IS NULL);

-- 3. Verify the fix
SELECT 
  e.id,
  e.title,
  e.school_id,
  e.is_published,
  c.title as course_title,
  c.school_id as course_school_id
FROM exams e
JOIN courses c ON e.course_id = c.id
WHERE e.id = '433580b6-141a-4451-beed-d0069e4fd464';

-- 4. Check if there are any other exams that need fixing
SELECT 
  e.id,
  e.title,
  e.school_id,
  e.is_published,
  c.title as course_title,
  c.school_id as course_school_id
FROM exams e
JOIN courses c ON e.course_id = c.id
WHERE e.is_published = false OR e.school_id IS NULL;
