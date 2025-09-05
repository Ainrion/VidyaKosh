# Exam Session Feature

## Overview

The exam session feature provides a comprehensive examination system for the Vidyakosh LMS, allowing teachers to create, manage, and grade exams while providing students with a seamless exam-taking experience.

## Features

### For Teachers

1. **Exam Creation**
   - Create exams with multiple question types (Multiple Choice, True/False, Short Answer, Essay)
   - Set exam duration and time windows
   - Assign point values to questions
   - Publish/unpublish exams

2. **Question Management**
   - Add/edit/remove questions
   - Support for different question types with proper validation
   - Set correct answers for auto-grading

3. **Results & Grading**
   - View student submissions and scores
   - Manual grading for short answer and essay questions
   - Export results to CSV
   - Performance analytics

### For Students

1. **Exam Taking**
   - View available exams from enrolled courses
   - Real-time timer with visual warnings
   - Auto-save answers as they type
   - Auto-submit when time expires
   - Progress tracking

2. **Results Viewing**
   - View completed exam results
   - Performance insights and grade analysis
   - Historical exam records

## Database Schema

### New Tables

1. **exams**
   - Stores exam metadata (title, description, duration, time windows)
   - Links to courses and tracks created_by teacher

2. **exam_questions**
   - Stores individual questions with type, options, correct answers
   - Supports multiple question types with flexible JSON storage

3. **exam_sessions**
   - Tracks individual student exam attempts
   - Stores answers, timing, and grading information
   - Prevents multiple attempts per student per exam

### Key Features

- **Row Level Security (RLS)**: Ensures students can only access their own exam sessions
- **Auto-grading**: Automatic scoring for multiple choice and true/false questions
- **Manual grading**: Support for teacher review of short answer and essay questions
- **Time tracking**: Precise timing with auto-submission capabilities

## Components

### Core Components

1. **ExamTimer** (`/src/components/exam-timer.tsx`)
   - Real-time countdown timer
   - Visual warnings at 25% and 10% time remaining
   - Auto-submit functionality

2. **Exam Management** (`/src/app/exams/page.tsx`)
   - Teacher interface for creating and managing exams
   - Question builder with different question types
   - Exam publishing controls

3. **Exam Taking** (`/src/app/exams/[id]/take/page.tsx`)
   - Student exam interface
   - Progress tracking and answer auto-save
   - Submission confirmation

4. **Results Dashboard** (`/src/app/exams/[id]/results/page.tsx`)
   - Comprehensive results view for teachers
   - Manual grading interface
   - Performance analytics

### Student Views

1. **Available Exams** (`/src/app/student/exams/page.tsx`)
   - Lists all available exams for enrolled courses
   - Shows exam status (upcoming, available, completed, expired)

2. **Completed Exams** (`/src/app/exams/completed/page.tsx`)
   - Historical view of completed exams
   - Performance insights and grade tracking

## Navigation Updates

Updated navigation menus to include exam links:
- Teachers: Access to exam creation and management
- Students: Access to available and completed exams
- Admins: Full exam system access

## Security Features

- **Time-based Access Control**: Exams only available within specified time windows
- **Single Attempt Prevention**: Database constraints prevent multiple exam sessions
- **Role-based Permissions**: Teachers can only manage their own exams
- **Auto-submission**: Prevents cheating by enforcing time limits

## Usage Instructions

### For Teachers

1. Navigate to "Exams" in the sidebar
2. Click "Create Exam" to start a new exam
3. Fill in exam details (title, description, duration, course)
4. Add questions using the question builder
5. Set correct answers for auto-gradable questions
6. Publish the exam when ready

### For Students

1. Navigate to "Exams" in the sidebar to see available exams
2. Click "Start Exam" to begin (or "Resume Exam" if already started)
3. Answer questions - answers are auto-saved
4. Watch the timer in the top-right corner
5. Submit manually or wait for auto-submission
6. View results in "Completed Exams"

## Technical Implementation

### Timer Implementation
- Uses browser-based timing with server validation
- Handles page refreshes and browser closure
- Visual countdown with warning states

### Auto-save Functionality
- Debounced saves to prevent excessive API calls
- Maintains exam state across page reloads
- Conflict resolution for concurrent edits

### Grading System
- Immediate auto-grading for objective questions
- Manual grading workflow for subjective questions
- Grade calculation with weighted scoring

## Migration

To add this feature to your existing Vidyakosh installation:

1. Run the exam tables migration:
   ```sql
   -- Execute the contents of /migrations/add_exam_tables.sql
   ```

2. Update your database types if using TypeScript:
   - The updated `database.types.ts` includes all new exam types

3. Restart your application to load the new components

## Future Enhancements

- Question banks and reusable question libraries
- Advanced question types (matching, ordering, etc.)
- Proctoring features and integrity monitoring
- Analytics and reporting improvements
- Bulk operations for exam management
