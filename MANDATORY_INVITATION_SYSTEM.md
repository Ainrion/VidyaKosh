# Vidyakosh LMS - Mandatory Invitation System for Students

## 🎯 **System Overview**

Students are now **required** to use an invitation code for their first-time signup. This ensures proper school enrollment and prevents unauthorized access to the system.

---

## 🔐 **Enforcement Rules**

### **Students:**
- ✅ **MUST** use invitation code for first-time signup
- ✅ **CANNOT** sign up without a valid invitation
- ✅ **CAN** login normally after successful signup
- ✅ **AUTOMATICALLY** get school access upon signup with invitation

### **Admins & Teachers:**
- ✅ **CAN** sign up without invitation codes
- ✅ **CAN** create schools and manage students
- ✅ **CAN** send invitations to students

---

## 🔄 **Updated Signup Flow**

### **1. Student Signup (Mandatory Invitation)**
```
Student receives invitation email → Student goes to signup page → 
Student enters invitation code → System validates code → 
Student creates account → Student gets school access → 
Student can login normally
```

### **2. Admin/Teacher Signup (No Invitation Required)**
```
Admin/Teacher goes to signup page → Selects "Admin/Teacher" tab → 
Creates account with school details → Account created → 
Can login normally
```

---

## 🎨 **UI Changes Made**

### **Signup Page Updates:**
- ✅ **Default tab** changed to "Student Signup" (invitation-based)
- ✅ **Tab labels** updated for clarity:
  - "Student Signup" (requires invitation)
  - "Admin/Teacher" (no invitation needed)
- ✅ **Clear messaging** about invitation requirement
- ✅ **Visual indicators** showing which signup method to use

### **Student Signup Tab:**
- ✅ **Header section** explaining invitation requirement
- ✅ **Invitation code validation** with real-time feedback
- ✅ **School information display** when code is valid
- ✅ **Clear error messages** for invalid/expired codes

### **Admin/Teacher Tab:**
- ✅ **Note section** explaining student invitation requirement
- ✅ **Role selection** limited to admin/teacher only
- ✅ **No student option** in regular signup

---

## 🔧 **Technical Implementation**

### **API Changes (`/api/auth/signup`):**
```typescript
// Enforce invitation code requirement for students
if (role === 'student') {
  if (!invitationCode) {
    return NextResponse.json({ 
      error: 'Students must sign up using an invitation code from their school administrator' 
    }, { status: 400 })
  }

  // Validate invitation code
  const { data: invitation } = await supabase
    .from('school_invitations')
    .select('*')
    .eq('invitation_code', invitationCode)
    .eq('email', email)
    .eq('status', 'pending')
    .single()

  // Check expiration and validity
  // Use school from invitation
}
```

### **Profile Creation:**
```typescript
// For students with invitation, automatically grant school access
if (role === 'student' && invitationCode) {
  profileData.school_access_granted = true
  profileData.school_access_granted_at = new Date().toISOString()
  profileData.invitation_id = invitation.id
}
```

### **Invitation Status Update:**
```typescript
// Mark invitation as accepted
await supabase
  .from('school_invitations')
  .update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    accepted_by: authData.user.id
  })
  .eq('id', invitation.id)
```

---

## 📊 **Database Schema Updates**

### **Required Tables:**
- `school_invitations` - Stores invitation details
- `profiles` - Contains school access flags
- `schools` - School information

### **Profile Fields for Students:**
```sql
profiles:
  - school_access_granted (BOOLEAN)
  - school_access_granted_at (TIMESTAMP)
  - invitation_id (UUID) - Links to school_invitations
```

---

## 🚀 **User Experience Flow**

### **For New Students:**
1. **Receive invitation email** from school administrator
2. **Click signup link** or go to signup page
3. **Select "Student Signup"** tab (default)
4. **Enter invitation code** from email
5. **Fill in personal details** (name, email, password)
6. **Create account** - automatically gets school access
7. **Login normally** for future access

### **For School Administrators:**
1. **Create school** (if first admin)
2. **Send invitations** to students via email
3. **Monitor invitation status** in admin panel
4. **Manage student access** as needed

### **For Teachers:**
1. **Sign up** using "Admin/Teacher" tab
2. **Get assigned to school** by admin
3. **Create course enrollment codes** for students
4. **Manage course enrollments**

---

## 🔒 **Security Benefits**

### **Access Control:**
- ✅ **No unauthorized student signups** - invitation required
- ✅ **Email verification** - invitation sent to specific email
- ✅ **Code expiration** - invitations expire after 7 days
- ✅ **One-time use** - invitation codes can only be used once

### **School Management:**
- ✅ **Controlled enrollment** - only invited students can join
- ✅ **Email tracking** - know exactly who was invited
- ✅ **Status monitoring** - track invitation acceptance
- ✅ **Automatic access** - no manual approval needed

---

## 📝 **Error Handling**

### **Common Error Messages:**
- **"Students must sign up using an invitation code"** - Student tried regular signup
- **"Invalid or expired invitation code"** - Code doesn't exist or expired
- **"Invitation code has expired"** - Code is past expiration date
- **"Email doesn't match invitation"** - Wrong email for invitation

### **User Guidance:**
- Clear instructions on how to get invitation
- Contact information for school administrators
- Helpful error messages with next steps

---

## 🎯 **Key Benefits**

### **For Schools:**
- ✅ **Complete control** over student enrollment
- ✅ **No random signups** - only invited students
- ✅ **Email verification** - ensures correct student
- ✅ **Automatic access** - no manual approval needed

### **For Students:**
- ✅ **Clear process** - know exactly what to do
- ✅ **Automatic access** - no waiting for approval
- ✅ **Secure signup** - invitation-based security
- ✅ **Normal login** - after first signup

### **For System:**
- ✅ **Better security** - controlled access
- ✅ **Cleaner data** - only legitimate users
- ✅ **Easier management** - clear enrollment process
- ✅ **Scalable** - works for any school size

---

## 🚀 **Implementation Status**

- ✅ **Frontend updated** - Clear signup flow
- ✅ **API enforced** - Invitation validation
- ✅ **Database ready** - Proper schema
- ✅ **Error handling** - User-friendly messages
- ✅ **Testing complete** - System working correctly

**The Vidyakosh LMS now enforces mandatory invitation signup for students, ensuring proper school enrollment and better security!** 🎉
