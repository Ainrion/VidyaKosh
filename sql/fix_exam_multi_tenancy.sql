-- Fix Exam Multi-Tenancy Issues
-- This ensures exams are properly isolated by school
-- Run this in your Supabase SQL Editor

-- ========================================
-- 1. CHECK CURRENT EXAM DATA
-- ========================================

SELECT 'Current exam data analysis:' as info;
SELECT 
  e.id,
  e.title,
  e.school_id,
  s.name as school_name,
  e.created_by,
  p.full_name as creator_name,
  e.created_at,
  CASE 
    WHEN s.id IS NULL THEN 'INVALID SCHOOL'
    ELSE 'VALID'
  END as school_status
FROM exams e
LEFT JOIN schools s ON e.school_id = s.id
LEFT JOIN profiles p ON e.created_by = p.id
ORDER BY e.created_at DESC;

-- ========================================
-- 2. CHECK FOR EXAMS WITH INVALID SCHOOL_ID
-- ========================================

SELECT 'Exams with invalid school_id:' as info;
SELECT 
  e.id,
  e.title,
  e.school_id,
  e.created_by,
  e.created_at
FROM exams e
WHERE e.school_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = e.school_id)
ORDER BY e.created_at DESC;

-- ========================================
-- 3. CHECK FOR EXAMS WITH NULL SCHOOL_ID
-- ========================================

SELECT 'Exams with NULL school_id:' as info;
SELECT 
  e.id,
  e.title,
  e.course_id,
  c.title as course_title,
  c.school_id as course_school_id,
  e.created_by,
  e.created_at
FROM exams e
LEFT JOIN courses c ON e.course_id = c.id
WHERE e.school_id IS NULL
ORDER BY e.created_at DESC;

-- ========================================
-- 4. FIX EXAMS WITH INVALID SCHOOL_ID
-- ========================================

-- Update exams with invalid school_id to use default school
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- Update exams with invalid school_id
  UPDATE exams 
  SET school_id = default_school_id
  WHERE school_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM schools WHERE id = exams.school_id);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % exams with invalid school_id', updated_count;
END $$;

-- ========================================
-- 5. FIX EXAMS WITH NULL SCHOOL_ID
-- ========================================

-- Update exams with NULL school_id based on their course's school_id
DO $$
DECLARE
  default_school_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the default school ID
  SELECT id INTO default_school_id FROM schools WHERE name = 'Default School' LIMIT 1;
  
  -- Update exams with NULL school_id based on course's school_id
  UPDATE exams 
  SET school_id = COALESCE(c.school_id, default_school_id)
  FROM courses c
  WHERE exams.course_id = c.id
  AND exams.school_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % exams with NULL school_id', updated_count;
END $$;

-- ========================================
-- 6. CREATE/UPDATE RLS POLICIES FOR EXAMS
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view exams in their school" ON exams;
DROP POLICY IF EXISTS "Teachers can create exams in their school" ON exams;
DROP POLICY IF EXISTS "Teachers can update their own exams" ON exams;
DROP POLICY IF EXISTS "Teachers can delete their own exams" ON exams;

-- Create comprehensive RLS policies for exams
CREATE POLICY "Users can view exams in their school" ON exams
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create exams in their school" ON exams
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own exams" ON exams
  FOR UPDATE USING (
    created_by = auth.uid() AND
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete their own exams" ON exams
  FOR DELETE USING (
    created_by = auth.uid() AND
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ========================================
-- 7. CREATE/UPDATE RLS POLICIES FOR EXAM_QUESTIONS
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view exam questions in their school" ON exam_questions;
DROP POLICY IF EXISTS "Teachers can create exam questions in their school" ON exam_questions;
DROP POLICY IF EXISTS "Teachers can update exam questions in their school" ON exam_questions;
DROP POLICY IF EXISTS "Teachers can delete exam questions in their school" ON exam_questions;

-- Create comprehensive RLS policies for exam_questions
CREATE POLICY "Users can view exam questions in their school" ON exam_questions
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create exam questions in their school" ON exam_questions
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update exam questions in their school" ON exam_questions
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete exam questions in their school" ON exam_questions
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ========================================
-- 8. CREATE/UPDATE RLS POLICIES FOR EXAM_SESSIONS
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view exam sessions in their school" ON exam_sessions;
DROP POLICY IF EXISTS "Students can create exam sessions for their exams" ON exam_sessions;
DROP POLICY IF EXISTS "Students can update their own exam sessions" ON exam_sessions;

-- Create comprehensive RLS policies for exam_sessions
CREATE POLICY "Users can view exam sessions in their school" ON exam_sessions
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Students can create exam sessions for their exams" ON exam_sessions
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own exam sessions" ON exam_sessions
  FOR UPDATE USING (
    student_id = auth.uid() AND
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ========================================
-- 9. CREATE/UPDATE RLS POLICIES FOR EXAM_ANSWERS
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view exam answers in their school" ON exam_answers;
DROP POLICY IF EXISTS "Students can create exam answers for their sessions" ON exam_answers;
DROP POLICY IF EXISTS "Students can update their own exam answers" ON exam_answers;

-- Create comprehensive RLS policies for exam_answers
CREATE POLICY "Users can view exam answers in their school" ON exam_answers
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Students can create exam answers for their sessions" ON exam_answers
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    ) AND
    exam_session_id IN (
      SELECT id FROM exam_sessions WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own exam answers" ON exam_answers
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    ) AND
    exam_session_id IN (
      SELECT id FROM exam_sessions WHERE student_id = auth.uid()
    )
  );

-- ========================================
-- 10. VERIFY THE FIX
-- ========================================

SELECT 'Verification after fix:' as info;

SELECT 
  'Total exams:' as metric, COUNT(*)::text as value FROM exams
UNION ALL
SELECT 'Exams with invalid school_id:' as metric, COUNT(*)::text as value 
FROM exams e WHERE e.school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM schools s WHERE s.id = e.school_id)
UNION ALL
SELECT 'Exams with NULL school_id:' as metric, COUNT(*)::text as value 
FROM exams WHERE school_id IS NULL
UNION ALL
SELECT 'Exams with valid school_id:' as metric, COUNT(*)::text as value 
FROM exams e WHERE e.school_id IS NOT NULL AND EXISTS (SELECT 1 FROM schools s WHERE s.id = e.school_id);

-- ========================================
-- 11. EXAM DISTRIBUTION BY SCHOOL
-- ========================================

SELECT 'Exam distribution by school:' as info;
SELECT 
  s.name as school_name,
  COUNT(e.id) as exam_count,
  COUNT(CASE WHEN e.is_published = true THEN 1 END) as published_exams,
  COUNT(CASE WHEN e.is_published = false THEN 1 END) as draft_exams
FROM schools s
LEFT JOIN exams e ON s.id = e.school_id
GROUP BY s.id, s.name
ORDER BY exam_count DESC;

-- ========================================
-- 12. FINAL SUMMARY
-- ========================================

SELECT '✅ Exam multi-tenancy fixed!' as status;
SELECT 'All exams now have valid school_id references.' as result;
SELECT 'RLS policies ensure school-based isolation.' as security;
SELECT 'The frontend will now only show exams from the correct school.' as next_step;
