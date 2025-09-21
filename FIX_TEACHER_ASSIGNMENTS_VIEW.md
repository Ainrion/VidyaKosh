# Fix Teacher Assignments View

## Problem
Teachers are not seeing assignments on the assignments page because the RLS policies are too restrictive. Teachers can only see assignments from courses they created, but they should be able to see all assignments in their school.

## Solution
Update the RLS policies to allow teachers to view all assignments in their school.

## SQL Commands to Run

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Drop the existing restrictive policy for teachers
DROP POLICY IF EXISTS "Teachers can view own course assignments" ON assignments;

-- Create a new policy that allows teachers to view all assignments in their school
CREATE POLICY "Teachers can view school assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles teacher_profile, courses
    WHERE teacher_profile.id = auth.uid()
    AND teacher_profile.role = 'teacher'
    AND courses.id = assignments.course_id
    AND courses.school_id = teacher_profile.school_id
  )
);

-- Drop the existing restrictive policy for teachers management
DROP POLICY IF EXISTS "Teachers can manage own course assignments" ON assignments;

-- Create a new policy that allows teachers to manage assignments in their school
CREATE POLICY "Teachers can manage school assignments" ON assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles teacher_profile, courses
    WHERE teacher_profile.id = auth.uid()
    AND teacher_profile.role = 'teacher'
    AND courses.id = assignments.course_id
    AND courses.school_id = teacher_profile.school_id
  )
);
```

## What This Fixes

1. **Before**: Teachers could only see assignments from courses they created
2. **After**: Teachers can see all assignments in their school
3. **Before**: Teachers could only manage assignments from their own courses  
4. **After**: Teachers can manage assignments across their entire school

## Testing

After running the SQL commands:

1. Log in as a teacher
2. Go to the Assignments page
3. You should now see all assignments from all courses in your school
4. The assignments should be visible regardless of who created them

## Code Changes Made

The frontend code has also been updated to handle different user roles properly:

- **Students**: See assignments from enrolled courses only
- **Teachers**: See all assignments in their school (via RLS policies)
- **Admins**: See all assignments in their school (via RLS policies)

The `fetchAssignments` function in `src/app/assignments/page.tsx` now checks the user role and applies appropriate filtering logic.




