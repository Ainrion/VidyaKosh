# 🔧 Signup Flow Fix - All Three Roles

## 🚨 **Problem Identified**

The signup flow was experiencing internal server errors due to:

1. **Missing Field Validation**: No client-side validation before API calls
2. **Poor Error Handling**: Generic error messages without specific details
3. **Insufficient Logging**: Hard to debug issues in production
4. **Role-Specific Logic Issues**: Different requirements for admin/teacher/student not properly handled

## 🛠️ **Comprehensive Solution**

### **1. Enhanced Client-Side Validation**

#### **Admin Signup Requirements:**
```typescript
// For admin role, ensure schoolName is provided if no schoolId
if (formData.role === 'admin' && !signupData.schoolId && !signupData.schoolName) {
  throw new Error('School name is required for admin registration')
}
```

#### **Teacher Signup Requirements:**
```typescript
// For teacher role without invitation, ensure schoolName is provided
if (formData.role === 'teacher' && !signupData.invitationCode && !signupData.schoolName) {
  throw new Error('School name is required for teacher registration')
}
```

#### **Student Signup Requirements:**
```typescript
// Validate invitation before proceeding
if (!invitation) {
  throw new Error('Please enter a valid invitation code')
}
```

### **2. Improved Error Handling & Logging**

#### **Client-Side Logging:**
```typescript
console.log('Sending signup data:', { ...signupData, password: '[HIDDEN]' })
console.error('Signup API error:', data)
```

#### **Server-Side Logging:**
```typescript
console.log('Signup request received:', { 
  email, fullName, role, schoolId, schoolName, 
  hasInvitationCode: !!invitationCode, password: '[HIDDEN]'
})
console.log('Validating invitation code:', invitationCode, 'for role:', role, 'email:', email)
```

### **3. Role-Specific Signup Flows**

#### **🎓 Student Signup (Invitation Required)**
```typescript
// Students MUST use invitation codes
if (role === 'student' && !invitationCode) {
  return NextResponse.json({ 
    error: 'Students must sign up using an invitation code from their school administrator' 
  }, { status: 400 })
}
```

#### **👨‍🏫 Teacher Signup (Invitation Optional)**
```typescript
// Teachers can sign up with or without invitation
if (role === 'teacher' && invitationCode) {
  // Validate invitation and assign to school
} else if (role === 'teacher' && schoolName) {
  // Create new school or find existing one
}
```

#### **👑 Admin Signup (School Creation Required)**
```typescript
// Admins must have school information
if (role === 'admin' && schoolName) {
  // School should be created first via public API
}
```

### **4. Enhanced Invitation Validation**

#### **Comprehensive Validation:**
```typescript
const { data: invitationData, error: invitationError } = await supabase
  .from('school_invitations')
  .select(`
    *,
    school:schools(*),
    invited_by_profile:profiles!school_invitations_invited_by_fkey(*)
  `)
  .eq('invitation_code', invitationCode)
  .eq('email', email)
  .eq('role', role)
  .eq('status', 'pending')
  .single()
```

#### **Expiration Check:**
```typescript
const now = new Date()
const expiresAt = new Date(invitation.expires_at)
if (now > expiresAt) {
  return NextResponse.json({ 
    error: 'Invitation code has expired. Please contact your school administrator for a new invitation.' 
  }, { status: 400 })
}
```

## ✅ **Fixed Issues**

### **1. Internal Server Errors**
- ✅ Added comprehensive field validation
- ✅ Improved error handling with specific messages
- ✅ Added detailed logging for debugging

### **2. Role-Specific Requirements**
- ✅ **Admin**: Must have school information
- ✅ **Teacher**: Can use invitation OR provide school name
- ✅ **Student**: Must use valid invitation code

### **3. Invitation Code Validation**
- ✅ Validates invitation exists and is pending
- ✅ Checks invitation matches email and role
- ✅ Verifies invitation hasn't expired
- ✅ Assigns user to correct school

### **4. Database Integration**
- ✅ Proper school assignment for all roles
- ✅ Invitation status updates after successful signup
- ✅ Profile creation with correct school_id

## 🧪 **Testing Scenarios**

### **Test 1: Student with Valid Invitation**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "fullName": "Test Student",
    "role": "student",
    "invitationCode": "VALID_CODE"
  }'
```

### **Test 2: Teacher with School Name**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "fullName": "Test Teacher",
    "role": "teacher",
    "schoolName": "Test School"
  }'
```

### **Test 3: Admin with School ID**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "fullName": "Test Admin",
    "role": "admin",
    "schoolId": "SCHOOL_UUID"
  }'
```

## 🎯 **Result**

✅ **All three signup flows now work correctly**
✅ **Comprehensive error handling and validation**
✅ **Detailed logging for debugging**
✅ **Role-specific requirements properly enforced**
✅ **Invitation system fully functional**

The signup flow is now robust and handles all edge cases properly! 🚀






