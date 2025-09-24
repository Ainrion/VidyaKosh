# SQL Scripts Directory

This directory contains all SQL scripts for database setup, migrations, and fixes for the Riven LMS system.

## 📁 Script Categories

### 🔧 **Multi-Tenancy & School Isolation**
- `fix_school_id_issues.sql` - **CURRENT** - Comprehensive fix for all school_id issues
- `fix_exam_multi_tenancy.sql` - **CURRENT** - Fix exam multi-tenancy and RLS policies
- `safe_multi_tenant_schema_update.sql` - Safe multi-tenant schema migration
- `fixed_multi_tenant_schema_update.sql` - Fixed version of multi-tenant schema
- `multi_tenant_schema_update.sql` - Original multi-tenant schema (has issues)

### 🏫 **School Management**
- `check_schools_table.sql` - **CURRENT** - Health check for schools table
- `fix_profile_school_references.sql` - **CURRENT** - Fix profile school references
- `complete_school_code_setup.sql` - School code system setup
- `auto_school_code_trigger.sql` - Auto-generate school codes

### 📚 **Course Management**
- `cleanup_duplicate_courses.sql` - **CURRENT** - Remove duplicate courses
- `fix_courses_data_integrity.sql` - **CURRENT** - Fix course data integrity
- `simple_courses_debug.sql` - **CURRENT** - Debug course visibility issues
- `debug_courses_issue.sql` - Debug course issues
- `fix_course_creation_rls.sql` - Fix course creation RLS

### 📝 **Exam System**
- `fix_exam_rls_policies.sql` - Fix exam RLS policies
- `add_exam_file_columns.sql` - Add file upload columns to exams
- `create_exam_answers_table.sql` - Create exam answers table
- `enhance_exam_schema.sql` - Enhance exam schema

### 📋 **Assignment System**
- `optimize_assignment_schema.sql` - Optimize assignment schema
- `fix_assignment_rls_policies.sql` - Fix assignment RLS
- `add_assignment_files.sql` - Add file support to assignments
- `fix_assignments_table.sql` - Fix assignments table

### 🗂️ **File Storage & Wasabi**
- `optimize_wasabi_setup.sql` - Optimize Wasabi S3 setup
- `setup_assignment_storage.sql` - Setup assignment file storage
- `QUICK_FIX_STORAGE_BUCKET.sql` - Quick storage bucket fix

### 👥 **User Management**
- `complete_database_setup.sql` - Complete database setup
- `enhance_user_management.sql` - Enhance user management
- `add_profile_fields_complete.sql` - Add profile fields
- `fix_profiles_rls.sql` - Fix profiles RLS
- `disable_profiles_rls.sql` - Disable profiles RLS

### 📊 **Enrollment System**
- `complete_enrollment_system.sql` - Complete enrollment system
- `fix_enrollment_system.sql` - Fix enrollment system
- `create_course_enrollment_codes_complete.sql` - Course enrollment codes
- `fix_enrollment_code_generation.sql` - Fix enrollment code generation

### 💬 **Messaging System**
- `fix_messaging_database_v3.sql` - Latest messaging database fix
- `create_channels_table.sql` - Create channels table
- `fix_blackboard_rls_policies.sql` - Fix blackboard RLS

### 🗓️ **Calendar & Events**
- `fix_calendar_rls.sql` - Fix calendar RLS

### 🧪 **Quiz System**
- `create_quiz_submission_tables.sql` - Quiz submission tables
- `fix_quizzes_rls.sql` - Fix quizzes RLS

### 🔐 **Security & RLS**
- `fix_all_rls_issues.sql` - Fix all RLS issues
- `optimized_rls_fix.sql` - Optimized RLS fix
- `security-audit-admin-pages.sql` - Security audit

## 🚨 **Current Priority Scripts**

### **Run These First:**
1. `check_schools_table.sql` - Check current state
2. `fix_school_id_issues.sql` - Fix all school_id issues
3. `fix_exam_multi_tenancy.sql` - Fix exam isolation
4. `cleanup_duplicate_courses.sql` - Clean up duplicate courses

### **Then Run:**
5. `fix_profile_school_references.sql` - Fix profile references

## 📋 **Script Execution Order**

### **For Multi-Tenancy Setup:**
```sql
-- 1. Check current state
check_schools_table.sql

-- 2. Fix school_id issues
fix_school_id_issues.sql

-- 3. Fix exam multi-tenancy
fix_exam_multi_tenancy.sql

-- 4. Clean up duplicate data
cleanup_duplicate_courses.sql

-- 5. Fix profile references
fix_profile_school_references.sql
```

### **For Complete System Setup:**
```sql
-- 1. Basic setup
complete_database_setup.sql

-- 2. User management
enhance_user_management.sql

-- 3. School system
complete_school_code_setup.sql

-- 4. Course system
complete_enrollment_system.sql

-- 5. Exam system
enhance_exam_schema.sql

-- 6. Assignment system
optimize_assignment_schema.sql

-- 7. Multi-tenancy
safe_multi_tenant_schema_update.sql
```

## ⚠️ **Important Notes**

- **Always backup your database** before running any scripts
- **Test scripts in development** before running in production
- **Read script comments** for specific instructions
- **Some scripts modify data** - be careful with production data
- **RLS policies** may affect application behavior

## 🔍 **Debugging Scripts**

- `simple_courses_debug.sql` - Debug course visibility
- `debug_courses_issue.sql` - Debug course issues
- `test_profile_columns.sql` - Test profile columns
- `test_blackboard_setup.sql` - Test blackboard setup

## 📞 **Support**

If you encounter issues:
1. Check the script comments for specific instructions
2. Verify database permissions
3. Check for foreign key constraints
4. Ensure all required tables exist
5. Test with small data sets first
