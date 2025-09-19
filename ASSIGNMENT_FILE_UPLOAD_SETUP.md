# Assignment File Upload Feature Setup

## 🎯 Overview

The assignment file upload feature allows teachers and admins to attach files (PDFs, Word docs, Excel files, images) to assignments when creating them. Students can then download these files when viewing assignments.

## 📋 Setup Steps

### Step 1: Database Schema Update

Run the database migration to add file support to assignments:

```sql
-- Run in Supabase SQL Editor
-- File: add_assignment_files.sql
```

This adds the following columns to the `assignments` table:
- `attachment_url` - URL to the uploaded file
- `attachment_name` - Original filename
- `attachment_size` - File size in bytes
- `attachment_type` - MIME type of the file

### Step 2: Storage Bucket Setup

Create the Supabase storage bucket for assignment files:

```sql
-- Run in Supabase SQL Editor
-- File: setup_assignment_storage.sql
```

This creates:
- `assignment-files` storage bucket
- 25MB file size limit
- Allowed file types: PDF, Word, Excel, Images, Text
- RLS policies for secure access

### Step 3: Restart Development Server

```bash
npm run dev
```

## ✨ Features

### For Teachers/Admins

1. **File Upload in Assignment Creation**
   - Drag & drop or click to upload files
   - Support for multiple file types
   - 25MB file size limit
   - Real-time upload progress
   - File validation

2. **Supported File Types**
   - PDF documents (`.pdf`)
   - Word documents (`.doc`, `.docx`)
   - Excel spreadsheets (`.xls`, `.xlsx`)
   - Text files (`.txt`)
   - Images (`.jpg`, `.jpeg`, `.png`, `.gif`)

3. **File Management**
   - Files are stored securely in Supabase Storage
   - Organized by user ID and course ID
   - Automatic cleanup on assignment deletion

### For Students

1. **File Download**
   - View attached files in assignment details
   - Download files with one click
   - File size and type information displayed
   - Secure access through signed URLs

2. **Assignment View**
   - Files displayed with paperclip icon
   - File name and size shown
   - Download button for easy access

## 🔧 Technical Implementation

### File Upload Flow

1. **User selects file** → File validation (type, size)
2. **File upload** → Supabase Storage (`assignment-files` bucket)
3. **Database update** → Assignment record with file metadata
4. **File display** → Students can download via public URL

### API Endpoints

- `POST /api/assignments/upload-file` - Upload assignment file
- `DELETE /api/assignments/upload-file` - Delete assignment file

### Security Features

- **Authentication required** for uploads
- **Role-based permissions** (teachers/admins only)
- **File type validation** (whitelist approach)
- **File size limits** (25MB max)
- **RLS policies** for storage access
- **Secure file paths** with user/course organization

## 🎨 UI Components

### File Upload Component

- **Drag & drop interface** with visual feedback
- **Progress indicator** during upload
- **Error handling** with user-friendly messages
- **File preview** with name and size
- **Remove file** functionality

### Assignment Display

- **File attachment indicator** with paperclip icon
- **File information** (name, size, type)
- **Download button** for easy access
- **Responsive design** for all screen sizes

## 📱 User Experience

### Assignment Creation

1. Fill in assignment details (title, description, due date, points)
2. **Optional**: Upload assignment file using drag & drop or file picker
3. File uploads automatically with progress indication
4. Create assignment with attached file

### Assignment Viewing

1. View assignment details and description
2. **If file attached**: See file information with download option
3. Click "Download File" to access the attachment
4. File opens in new tab/window

## 🔍 File Organization

Files are organized in Supabase Storage as:
```
assignment-files/
├── {user_id}/
│   └── {course_id}/
│       └── {timestamp}-{filename}
```

This structure ensures:
- **User isolation** - Users can only access their own files
- **Course organization** - Files grouped by course
- **Unique filenames** - Timestamp prevents conflicts
- **Easy cleanup** - Can delete by user or course

## 🚀 Benefits

1. **Enhanced Learning** - Teachers can attach resources, worksheets, templates
2. **Better Organization** - All assignment materials in one place
3. **Easy Access** - Students can download files with one click
4. **Secure Storage** - Files stored safely in Supabase Storage
5. **Mobile Friendly** - Works on all devices
6. **File Management** - Automatic organization and cleanup

## 🛠️ Troubleshooting

### Common Issues

1. **File upload fails**
   - Check file size (max 25MB)
   - Verify file type is supported
   - Ensure user has teacher/admin role

2. **File not displaying**
   - Check if storage bucket exists
   - Verify RLS policies are set up
   - Check browser console for errors

3. **Download not working**
   - Verify file URL is accessible
   - Check if file still exists in storage
   - Ensure user is authenticated

### Debug Steps

1. Check Supabase Storage bucket exists
2. Verify RLS policies are active
3. Check browser network tab for API errors
4. Verify user permissions and role

## 📊 File Limits

- **Maximum file size**: 25MB
- **Supported formats**: PDF, Word, Excel, Images, Text
- **Storage location**: Supabase Storage (`assignment-files` bucket)
- **Access**: Public read, authenticated write

## 🔄 Future Enhancements

Potential improvements:
- Multiple file uploads per assignment
- File preview in browser
- File versioning
- Bulk file operations
- File sharing between assignments
- Advanced file management interface

---

The assignment file upload feature is now fully functional! Teachers can attach files to assignments, and students can easily download them for their coursework.
