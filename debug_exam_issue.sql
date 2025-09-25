-- Debug script to check exam visibility issues
-- Run this to understand why exams are not showing for students

-- 1. Check the specific exam that was created
SELECT 
  e.id,
  e.title,
  e.course_id,
  e.school_id,
  e.is_published,
  e.created_by,
  c.title as course_title,
  c.school_id as course_school_id
FROM exams e
LEFT JOIN courses c ON e.course_id = c.id
WHERE e.id = '433580b6-141a-4451-beed-d0069e4fd464';

-- 2. Check if the student is enrolled in the course
SELECT 
  en.id as enrollment_id,
  en.student_id,
  en.course_id,
  c.title as course_title,
  c.school_id as course_school_id,
  p.email as student_email,
  p.school_id as student_school_id
FROM enrollments en
JOIN courses c ON en.course_id = c.id
JOIN profiles p ON en.student_id = p.id
WHERE en.course_id = '8ac16708-f6cd-4799-9f15-f37580996881';

-- 3. Check all exams for the course
SELECT 
  e.id,
  e.title,
  e.school_id,
  e.is_published,
  c.title as course_title,
  c.school_id as course_school_id
FROM exams e
JOIN courses c ON e.course_id = c.id
WHERE e.course_id = '8ac16708-f6cd-4799-9f15-f37580996881';

-- 4. Check all enrollments for the student (replace with actual student ID)
-- SELECT 
--   en.id as enrollment_id,
--   en.student_id,
--   en.course_id,
--   c.title as course_title,
--   c.school_id as course_school_id
-- FROM enrollments en
-- JOIN courses c ON en.course_id = c.id
-- WHERE en.student_id = 'STUDENT_ID_HERE';

-- 5. Check if there are any exam sessions for this exam
SELECT 
  es.id,
  es.exam_id,
  es.student_id,
  es.status,
  p.email as student_email
FROM exam_sessions es
JOIN profiles p ON es.student_id = p.id
WHERE es.exam_id = '433580b6-141a-4451-beed-d0069e4fd464';
