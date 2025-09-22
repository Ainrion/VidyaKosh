# Assignment Role-Based Permissions Fix

## Issues Fixed

### 1. **Role-Based UI Permissions**
**Problem**: All users (including admins and teachers) were seeing "Submit Work" buttons in the assignment section.

**Solution**: 
- **Students**: Only see "Submit Work" button for assignments they haven't submitted
- **Teachers & Admins**: See "Manage" button and "Create Assignment" button instead
- **Assignment Detail Page**: Role-specific action buttons

### 2. **Data Filtering by School**
**Problem**: Admins were seeing assignments from other schools, indicating improper data isolation.

**Solution**:
- Updated RLS policies to ensure proper school-based filtering
- Added client-side filtering as extra safety measure
- Enhanced query to include school_id in course selection

## Files Modified

### 1. `/src/app/assignments/page.tsx`
**Changes**:
- Added role-based button rendering
- Added "Create Assignment" button for teachers/admins
- Updated page description based on user role
- Enhanced data fetching with school_id filtering
- Added client-side filtering for extra safety

### 2. `/src/app/assignments/[id]/page.tsx`
**Changes**:
- Added role-based action buttons
- Students see "Submit Work" button
- Teachers/Admins see "Edit Assignment" and "View Submissions" buttons

### 3. `/fix_assignment_rls_policies.sql` (New File)
**Purpose**: Comprehensive RLS policy fix for proper school-based data isolation

## Role-Based Behavior

### Students
- ✅ See only assignments from enrolled courses
- ✅ See "Submit Work" button for unsubmitted assignments
- ✅ Cannot create or manage assignments

### Teachers
- ✅ See all assignments in their school
- ✅ See "Manage" button for assignments
- ✅ See "Create Assignment" button
- ✅ Can create assignments in their courses

### Admins
- ✅ See all assignments in their school
- ✅ See "Manage" button for assignments
- ✅ See "Create Assignment" button
- ✅ Can manage all assignments in their school

## Database Changes Required

Run the SQL file `fix_assignment_rls_policies.sql` in your Supabase SQL Editor to:

1. **Drop conflicting RLS policies**
2. **Create clean, school-based policies**:
   - Students: Can view enrolled course assignments
   - Teachers: Can view/manage all assignments in their school
   - Admins: Can view/manage all assignments in their school

## Testing Checklist

### For Students
- [ ] Login as student
- [ ] Go to Assignments page
- [ ] Verify only enrolled course assignments are shown
- [ ] Verify "Submit Work" button appears for unsubmitted assignments
- [ ] Verify no "Create Assignment" button is visible

### For Teachers
- [ ] Login as teacher
- [ ] Go to Assignments page
- [ ] Verify all school assignments are shown
- [ ] Verify "Create Assignment" button is visible
- [ ] Verify "Manage" button appears for assignments
- [ ] Verify no "Submit Work" button is visible

### For Admins
- [ ] Login as admin
- [ ] Go to Assignments page
- [ ] Verify only school assignments are shown (not from other schools)
- [ ] Verify "Create Assignment" button is visible
- [ ] Verify "Manage" button appears for assignments
- [ ] Verify no "Submit Work" button is visible

## Security Improvements

1. **School Isolation**: Each school's data is properly isolated
2. **Role-Based Access**: Users only see appropriate actions for their role
3. **RLS Policies**: Database-level security ensures proper data filtering
4. **Client-Side Safety**: Additional filtering prevents data leakage

## Next Steps

1. **Run the SQL file** in Supabase to update RLS policies
2. **Test with different user roles** to verify functionality
3. **Create test assignments** to verify the system works properly
4. **Monitor logs** to ensure proper data filtering

## Notes

- The system now properly respects the existing role-based permission system
- All changes maintain backward compatibility
- No hardcoded data was found - the issue was with RLS policies and UI logic
- The assignment creation flow remains unchanged (through course pages)
