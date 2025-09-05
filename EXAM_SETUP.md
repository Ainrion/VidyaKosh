# Exam Feature Setup Guide

## Error: "Error fetching exams: {}"

This error occurs because the exam tables haven't been created in your Supabase database yet. Follow these steps to fix it:

## Step 1: Check Current Database State

1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `migrations/check_exam_setup.sql` to check if exam tables exist

## Step 2: Create Exam Tables

1. In the Supabase SQL Editor, copy and paste the **entire contents** of `migrations/add_exam_tables.sql`
2. Click "Run" to execute the migration
3. You should see success messages for table creation

## Step 3: Fix RLS Policies (if needed)

1. Copy and paste the contents of `migrations/fix_exam_rls_policies.sql`
2. Click "Run" to execute the policy fixes

## Step 4: Verify Setup

After running the migrations, you should see these new tables in your Supabase "Table Editor":
- `exams` - Stores exam metadata
- `exam_questions` - Stores questions for each exam  
- `exam_sessions` - Tracks student exam attempts

## Step 5: Test the Feature

1. Restart your development server: `npm run dev`
2. Navigate to `/exams` as a teacher/admin
3. You should now see the exam management interface without errors

## Troubleshooting

### If you still get errors:

1. **Check your user role**: Make sure your user profile has `role = 'admin'` or `role = 'teacher'`
2. **Check school assignment**: Make sure your user is assigned to a school
3. **Check browser console**: Look for more detailed error messages
4. **Check Supabase logs**: Go to Supabase dashboard > Logs for database errors

### Common issues:

- **"relation does not exist"**: Tables weren't created - run the migration again
- **"permission denied"**: RLS policies issue - run the policy fix migration
- **"No courses found"**: Create a course first, or check course RLS policies

## Database Schema Overview

The exam system adds these relationships:
```
courses (existing)
    ↓ (one-to-many)
exams
    ↓ (one-to-many)  
exam_questions

exams ← (many-to-one) → exam_sessions ← (many-to-one) → profiles (students)
```

## Features Enabled After Setup

- **Teachers/Admins**: Create, edit, and manage exams
- **Students**: Take timed exams with auto-submission
- **Auto-grading**: Multiple choice and true/false questions
- **Manual grading**: Short answer and essay questions
- **Results**: Comprehensive analytics and grade management
