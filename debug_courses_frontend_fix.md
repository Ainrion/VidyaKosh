# Debug: Courses Showing Non-Existent Data

## Issue Identified

The problem is in the frontend `fetchCourses` function in `/src/app/courses/page.tsx`. The query logic has a flaw that could allow courses from other schools to be displayed.

## Current Problematic Code (Lines 52-66):

```typescript
let query = supabase
  .from('courses')
  .select(`
    *,
    created_by_profile:profiles!courses_created_by_fkey(full_name),
    enrollments(count)
  `)
  .eq('school_id', profile.school_id)  // ✅ Good: Filters by school
  .eq('archived', false)
  .order('created_at', { ascending: false })

// Filter based on user role
if (profile.role === 'teacher') {
  query = query.or(`created_by.eq.${profile.id}`)  // ❌ PROBLEM: This OR condition could bypass school filter
}
```

## The Problem:

The `.or()` method in Supabase creates an OR condition that can bypass the previous `.eq('school_id', profile.school_id)` filter. This means:

1. If a teacher has `created_by` matching their ID in ANY school, those courses will show
2. The school_id filter becomes ineffective for teachers
3. This could show courses from other schools if the teacher ID matches

## Solution:

Replace the problematic OR condition with a proper AND condition that maintains school isolation.

## Fixed Code:

```typescript
let query = supabase
  .from('courses')
  .select(`
    *,
    created_by_profile:profiles!courses_created_by_fkey(full_name),
    enrollments(count)
  `)
  .eq('school_id', profile.school_id)  // Always filter by school first
  .eq('archived', false)
  .order('created_at', { ascending: false })

// Filter based on user role (maintaining school isolation)
if (profile.role === 'teacher') {
  query = query.eq('created_by', profile.id)  // ✅ Fixed: Use AND condition, not OR
}
// Admins and students will see all courses in their school (already filtered by school_id above)
```

## Additional Debugging Steps:

1. **Run the SQL diagnostic** (`debug_courses_issue.sql`) to check:
   - Current RLS policies
   - Data integrity issues
   - Orphaned records

2. **Check for data inconsistencies**:
   - Courses with invalid school_id references
   - Profiles with invalid school_id references
   - Cross-school data contamination

3. **Verify RLS policies** are working correctly

## Root Cause:

The issue is likely caused by:
1. **Frontend query logic flaw** (OR condition bypassing school filter)
2. **Potential data integrity issues** from the migration
3. **Possible RLS policy misconfiguration**

## Next Steps:

1. Fix the frontend query logic
2. Run the SQL diagnostic to check data integrity
3. Verify RLS policies are properly configured
4. Test with different user roles to ensure school isolation
