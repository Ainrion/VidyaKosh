# Optimized Wasabi File Upload System Setup

This guide provides a complete setup for the optimized file upload system with Wasabi storage integration.

## 🚀 **What's Been Optimized**

### **Enhanced Features:**
- ✅ **Better File Organization**: Date-based folder structure
- ✅ **Improved Error Handling**: Specific error messages and retry logic
- ✅ **File Management**: Preview, delete, replace functionality
- ✅ **Progress Tracking**: Real-time upload progress
- ✅ **Metadata Storage**: File metadata and upload tracking
- ✅ **Cleanup Utilities**: Automatic orphaned file cleanup
- ✅ **Performance**: Optimized database indexes and queries

### **Storage Structure:**
```
exam-questions/
├── 2024-01-15/
│   ├── exam-123/
│   │   ├── question-456/
│   │   │   └── document_1705123456789.pdf
│   │   └── question-789/
│   │       └── image_1705123456790.jpg
│   └── exam-124/
└── 2024-01-16/

exam-answers/
├── 2024-01-15/
│   ├── session-abc/
│   │   ├── question-456/
│   │   │   └── answer_1705123456789.pdf
│   │   └── question-789/
│   │       └── response_1705123456790.docx
│   └── session-def/
```

## 📋 **Setup Instructions**

### **Step 1: Database Optimization**

Run the optimized database setup:

1. **Go to Supabase SQL Editor**
2. **Copy and paste** the contents of `optimize_wasabi_setup.sql`
3. **Execute the script**

This will:
- Add file management columns
- Create optimized indexes
- Set up proper RLS policies
- Add cleanup functions
- Create statistics views

### **Step 2: Wasabi Configuration**

Add these environment variables to your `.env.local`:

```env
# Wasabi Storage Configuration
WASABI_ACCESS_KEY_ID=your_access_key_id_here
WASABI_SECRET_ACCESS_KEY=your_secret_access_key_here
WASABI_REGION=us-east-1
WASABI_ENDPOINT=https://s3.wasabisys.com
WASABI_BUCKET_NAME=your_bucket_name_here
```

### **Step 3: Wasabi Bucket Setup**

1. **Create Wasabi Account**: https://wasabi.com
2. **Create Bucket**: Use a descriptive name like `exam-files-school`
3. **Configure Bucket**:
   - Enable public read access for question files
   - Set up CORS for web uploads
   - Configure lifecycle policies for cost optimization

### **Step 4: Test the System**

1. **Restart your development server**
2. **Create an exam with file upload questions**
3. **Test file upload, preview, and delete functionality**

## 🔧 **Advanced Configuration**

### **File Upload Limits:**
```typescript
// In src/lib/wasabi.ts
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/xml',
    'application/xml',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
}
```

### **Storage Optimization:**
```sql
-- Set up lifecycle policies in Wasabi
-- Move old files to cheaper storage tiers
-- Delete files older than 2 years
```

## 🎯 **Key Features**

### **1. Smart File Organization**
- **Date-based folders**: Files organized by upload date
- **Hierarchical structure**: examId/questionId/fileName
- **Sanitized names**: Special characters replaced with underscores

### **2. Enhanced UI Components**
- **Drag & Drop**: Intuitive file upload
- **Progress Tracking**: Real-time upload progress
- **File Preview**: Preview images and PDFs
- **File Management**: Delete, replace, download

### **3. Robust Error Handling**
- **Specific Error Messages**: Clear feedback for users
- **Retry Logic**: Automatic retry on network issues
- **Cleanup on Failure**: Remove partial uploads

### **4. File Management**
- **Replace Files**: Upload new files to replace existing ones
- **Delete Files**: Remove files from both database and storage
- **Preview Files**: View files without downloading
- **Metadata Tracking**: Store upload time and user info

### **5. Performance Optimizations**
- **Database Indexes**: Fast queries on file paths and dates
- **Batch Operations**: Efficient bulk file operations
- **Connection Pooling**: Optimized Wasabi connections
- **Caching**: File metadata caching

## 📊 **Monitoring & Maintenance**

### **File Statistics View:**
```sql
-- Check file upload statistics
SELECT * FROM file_upload_stats;
```

### **Cleanup Orphaned Files:**
```sql
-- Find files that exist in database but not in storage
SELECT * FROM cleanup_orphaned_files();
```

### **Storage Usage Monitoring:**
- Monitor Wasabi dashboard for storage usage
- Set up billing alerts
- Review file statistics regularly

## 🔒 **Security Features**

### **Access Control:**
- **RLS Policies**: Row-level security for all file operations
- **User Permissions**: Teachers/admins can manage questions, students can upload answers
- **File Validation**: Type and size validation

### **Data Protection:**
- **Server-side Encryption**: AES256 encryption for stored files
- **Metadata Protection**: Sensitive data in file metadata
- **Secure URLs**: Signed URLs for private file access

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Upload Fails**:
   - Check Wasabi credentials
   - Verify bucket exists and is accessible
   - Check file size limits

2. **Files Not Displaying**:
   - Verify public read access on bucket
   - Check CORS configuration
   - Verify file URLs in database

3. **Permission Errors**:
   - Check user role (admin/teacher for questions)
   - Verify RLS policies are correct
   - Check authentication status

### **Debug Tools:**
```javascript
// Check file existence
import { fileExistsInWasabi } from '@/lib/wasabi'
const exists = await fileExistsInWasabi('path/to/file.pdf')

// Get file metadata
import { getFileMetadata } from '@/lib/wasabi'
const metadata = await getFileMetadata('path/to/file.pdf')
```

## 📈 **Performance Tips**

1. **Optimize File Sizes**: Compress images and documents
2. **Use CDN**: Consider CloudFront for faster access
3. **Batch Operations**: Group file operations when possible
4. **Monitor Usage**: Track storage and bandwidth usage
5. **Cleanup Regularly**: Remove old and unused files

## 🎉 **Ready to Use!**

Your optimized file upload system is now ready with:
- ✅ Robust Wasabi integration
- ✅ Enhanced UI/UX
- ✅ Comprehensive file management
- ✅ Optimized database structure
- ✅ Advanced error handling
- ✅ Security and performance optimizations

Start creating exams with file upload questions and enjoy the enhanced functionality! 🚀
