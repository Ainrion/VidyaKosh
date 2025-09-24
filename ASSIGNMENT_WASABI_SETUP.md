# Assignment File Upload System with Wasabi Integration

This guide covers the complete setup for assignment file uploads using Wasabi storage, matching the optimized exam system.

## 🚀 **What's Been Implemented**

### **Enhanced Assignment Features:**
- ✅ **Wasabi Storage Integration**: Assignment files stored in Wasabi
- ✅ **Student Submission System**: Students can submit assignment files
- ✅ **File Management**: Preview, download, delete functionality
- ✅ **Enhanced UI**: Drag-and-drop with progress tracking
- ✅ **Database Optimization**: Enhanced schema with file tracking
- ✅ **Security**: Proper RLS policies and file validation

### **Storage Structure:**
```
assignments/
├── 2024-01-15/
│   ├── course-123/
│   │   ├── assignment-456/
│   │   │   └── document_1705123456789.pdf
│   │   └── assignment-789/
│   │       └── instructions_1705123456790.docx
│   └── course-124/

assignment-submissions/
├── 2024-01-15/
│   ├── course-123/
│   │   ├── assignment-456/
│   │   │   ├── user-abc/
│   │   │   │   └── submission_1705123456789.pdf
│   │   │   └── user-def/
│   │   │       └── response_1705123456790.docx
│   │   └── assignment-789/
│   └── course-124/
```

## 📋 **Setup Instructions**

### **Step 1: Database Optimization**

Run the assignment database setup:

1. **Go to Supabase SQL Editor**
2. **Copy and paste** the contents of `optimize_assignment_schema.sql`
3. **Execute the script**

This will:
- Add file management columns to assignments table
- Create assignment_submissions table
- Set up optimized indexes
- Create proper RLS policies
- Add cleanup functions and statistics views

### **Step 2: Wasabi Configuration**

Your existing Wasabi configuration will work for assignments too. Ensure these are in your `.env.local`:

```env
# Wasabi Storage Configuration (same as exams)
WASABI_ACCESS_KEY_ID=your_access_key_id_here
WASABI_SECRET_ACCESS_KEY=your_secret_access_key_here
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.wasabisys.com
WASABI_BUCKET_NAME=your_bucket_name_here
```

### **Step 3: Test the System**

1. **Restart your development server**
2. **Create an assignment with file upload**
3. **Test student file submission**
4. **Verify file management features**

## 🔧 **API Endpoints**

### **Assignment File Upload (Teachers/Admins)**
```typescript
POST /api/assignments/upload-file
// Upload assignment files (instructions, resources)
// Body: FormData with file, courseId, assignmentId
```

### **Assignment Submission (Students)**
```typescript
POST /api/assignments/submit-file
// Submit assignment files
// Body: FormData with file, courseId, assignmentId
```

### **File Management**
```typescript
DELETE /api/assignments/upload-file?filePath=...
DELETE /api/assignments/submit-file?assignmentId=...
// Delete files from both database and Wasabi
```

## 🎯 **Key Features**

### **1. Assignment File Management**
- **Teachers/Admins**: Upload assignment instructions and resources
- **File Organization**: Date-based folder structure
- **File Validation**: Type and size validation
- **Metadata Tracking**: Upload time and user info

### **2. Student Submission System**
- **File Submission**: Students can upload assignment files
- **Deadline Checking**: Automatic deadline validation
- **Enrollment Verification**: Only enrolled students can submit
- **File Replacement**: Students can replace their submissions

### **3. Enhanced UI Components**
- **AssignmentFileUpload**: Specialized component for assignments
- **Drag & Drop**: Intuitive file upload interface
- **Progress Tracking**: Real-time upload progress
- **File Preview**: Preview images and PDFs
- **File Management**: Download, preview, delete buttons

### **4. Security & Permissions**
- **RLS Policies**: Proper access control for all operations
- **Role-based Access**: Teachers create, students submit
- **File Validation**: Type and size restrictions
- **Enrollment Checks**: Students must be enrolled in course

### **5. Database Optimizations**
- **Enhanced Schema**: File tracking columns
- **Optimized Indexes**: Fast queries on file paths and dates
- **Submission Tracking**: Complete submission history
- **Statistics Views**: File upload analytics

## 📊 **Database Schema**

### **Assignments Table (Enhanced)**
```sql
-- New columns added
file_path TEXT,
file_name TEXT,
file_size INTEGER,
mime_type TEXT,
file_uploaded_at TIMESTAMP WITH TIME ZONE,
file_metadata JSONB
```

### **Assignment Submissions Table (New)**
```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES profiles(id),
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  file_uploaded_at TIMESTAMP WITH TIME ZONE,
  file_metadata JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(assignment_id, student_id)
);
```

## 🔒 **Security Features**

### **Access Control:**
- **Teachers/Admins**: Can upload assignment files
- **Students**: Can submit assignment files (if enrolled)
- **File Validation**: Type and size restrictions
- **Deadline Enforcement**: Automatic deadline checking

### **Data Protection:**
- **RLS Policies**: Row-level security for all operations
- **File Encryption**: AES256 encryption for stored files
- **Metadata Protection**: Sensitive data in file metadata
- **Secure URLs**: Public URLs for assignment files

## 📈 **Performance Features**

### **Optimizations:**
- **Database Indexes**: Fast queries on file paths and dates
- **Batch Operations**: Efficient bulk file operations
- **Connection Pooling**: Optimized Wasabi connections
- **File Compression**: Automatic file size optimization

### **Monitoring:**
```sql
-- File upload statistics
SELECT * FROM assignment_file_stats;

-- Submission tracking
SELECT * FROM assignment_submission_summary;

-- Orphaned file cleanup
SELECT * FROM cleanup_orphaned_assignment_files();
```

## 🎨 **UI Components**

### **AssignmentFileUpload Component**
```typescript
<AssignmentFileUpload
  courseId={courseId}
  assignmentId={assignmentId}
  onFileSelect={(file) => handleFileSelect(file)}
  onFileUpload={(fileData) => handleFileUpload(fileData)}
  existingFile={existingFile}
  placeholder="Upload assignment file..."
/>
```

### **Features:**
- **Drag & Drop**: Intuitive file upload
- **Progress Tracking**: Real-time upload progress
- **File Preview**: Preview images and PDFs
- **File Management**: Download, preview, delete
- **Error Handling**: Clear error messages

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Upload Fails**:
   - Check Wasabi credentials
   - Verify bucket exists and is accessible
   - Check file size limits (50MB max)

2. **Students Can't Submit**:
   - Verify student enrollment in course
   - Check assignment deadline
   - Ensure assignment is published

3. **Files Not Displaying**:
   - Verify public read access on bucket
   - Check file URLs in database
   - Verify RLS policies

### **Debug Tools:**
```sql
-- Check assignment file statistics
SELECT * FROM assignment_file_stats;

-- Check submission summary
SELECT * FROM assignment_submission_summary;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'assignments';
```

## 🎉 **Ready to Use!**

Your assignment file upload system now includes:
- ✅ Complete Wasabi integration
- ✅ Student submission system
- ✅ Enhanced file management
- ✅ Optimized database schema
- ✅ Security and performance optimizations
- ✅ Comprehensive UI components

The system now supports both exam and assignment file uploads with the same high-quality features! 🚀

## 📝 **Usage Examples**

### **For Teachers:**
1. Create assignment
2. Upload instruction files
3. Monitor student submissions
4. Download and grade submissions

### **For Students:**
1. View assignment instructions
2. Download required files
3. Upload submission files
4. Replace submissions if needed

### **For Admins:**
1. Monitor file usage
2. Clean up orphaned files
3. View upload statistics
4. Manage storage quotas
