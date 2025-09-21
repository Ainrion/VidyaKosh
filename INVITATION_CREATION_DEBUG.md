# Invitation Creation Debug Tools

## 🚨 **Problem Identified**

The invitation creation is still failing with:

```
Failed to create invitation
src/components/admin/invitation-management.tsx (108:15) @ sendInvitation
```

## 🔍 **Debug Tools Added**

I've added comprehensive debug tools to help identify the exact issue with invitation creation.

### **1. Debug System Button**
- **Purpose**: Check if all required database tables exist
- **Shows**: Table existence, record counts, user information
- **Location**: Top-right of invitation management page

### **2. Test Creation Button**
- **Purpose**: Test invitation creation step-by-step
- **Tests**: Code generation, uniqueness check, database insertion
- **Location**: Next to Debug System button

### **3. Debug API Endpoint (`/api/debug-invitations`)**
- **GET**: Returns system status and table information
- **POST**: Tests invitation creation process
- **Features**: Step-by-step testing with detailed error reporting

## 🧪 **How to Use Debug Tools**

### **Step 1: Check System Status**
1. Go to `/admin/invitations`
2. Click **"Debug System"** button
3. Check the alert for table status:
   ```
   Invitation System Debug:
   
   User: John Admin (admin)
   School ID: 123
   
   Tables:
   - school_invitations: ✅ (0 records)
   - profiles: ✅ (5 records)
   - schools: ✅ (1 records)
   ```

### **Step 2: Test Invitation Creation**
1. Click **"Test Creation"** button
2. Check the alert for test results:
   ```
   Invitation Creation Test: ✅ SUCCESS
   
   All steps completed successfully:
   - Code Generation: ✅
   - Code Uniqueness: ✅
   - Invitation Creation: ✅
   ```

### **Step 3: Check Console Logs**
Open browser console (F12) to see detailed debug information:
- Table existence status
- Error details
- Step-by-step test results

## 🔍 **Common Issues & Solutions**

### **Issue 1: Table Doesn't Exist**
**Symptoms**: `school_invitations: ❌ (0 records)`
**Solution**: Run database migration to create the table

### **Issue 2: Permission Denied**
**Symptoms**: `403 Forbidden` or `Insufficient permissions`
**Solution**: Ensure user has admin role

### **Issue 3: RLS Policy Issues**
**Symptoms**: `Failed to create invitation` with database errors
**Solution**: Check Row Level Security policies

### **Issue 4: Missing School ID**
**Symptoms**: `School ID: null`
**Solution**: Ensure user profile has school_id set

## 📊 **Debug Information Provided**

### **System Status:**
- User information (ID, role, school_id, name)
- Table existence (school_invitations, profiles, schools)
- Record counts for each table
- Error messages for missing tables

### **Creation Test:**
- Code generation success
- Code uniqueness verification
- Database insertion attempt
- Detailed error messages
- Cleanup of test data

## 🚀 **Expected Debug Results**

### **Healthy System:**
```
Invitation System Debug:
✅ school_invitations: ✅ (0 records)
✅ profiles: ✅ (5 records)  
✅ schools: ✅ (1 records)

Invitation Creation Test: ✅ SUCCESS
✅ Code Generation: ✅
✅ Code Uniqueness: ✅
✅ Invitation Creation: ✅
```

### **Problematic System:**
```
Invitation System Debug:
❌ school_invitations: ❌ (relation "school_invitations" does not exist)
✅ profiles: ✅ (5 records)
✅ schools: ✅ (1 records)

Invitation Creation Test: ❌ FAILED
✅ Code Generation: ✅
✅ Code Uniqueness: ✅
❌ Invitation Creation: ❌ (relation "school_invitations" does not exist)
```

## 🔧 **Next Steps Based on Debug Results**

### **If Tables Don't Exist:**
1. Run database migration scripts
2. Create missing tables manually
3. Set up proper RLS policies

### **If Creation Test Fails:**
1. Check specific error in console
2. Verify database permissions
3. Check RLS policies
4. Ensure proper data types

### **If Everything Shows Success:**
1. Check email configuration
2. Verify frontend error handling
3. Check for JavaScript errors

## 📁 **Files Added**

1. **`/src/app/api/debug-invitations/route.ts`** - Debug API endpoint
2. **`/src/components/admin/invitation-management.tsx`** - Added debug buttons
3. **`INVITATION_CREATION_DEBUG.md`** - This documentation

## 🎯 **How to Proceed**

1. **Use the debug tools** to identify the exact issue
2. **Check the console logs** for detailed error information
3. **Share the debug results** so I can provide specific fixes
4. **Test the fixes** using the debug tools

The debug tools will help us identify exactly what's causing the invitation creation to fail! 🕵️‍♂️

