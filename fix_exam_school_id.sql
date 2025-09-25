-- Fix existing exam with NULL school_id
-- This will update the exam to use the school_id from its associated course

UPDATE exams 
SET school_id = c.school_id
FROM courses c
WHERE exams.course_id = c.id
AND exams.school_id IS NULL;

-- Verify the fix
SELECT 
  e.id,
  e.title,
  e.school_id,
  c.title as course_title,
  c.school_id as course_school_id
FROM exams e
LEFT JOIN courses c ON e.course_id = c.id
WHERE e.id = '433580b6-141a-4451-beed-d0069e4fd464';
