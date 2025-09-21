# Vidyakosh LMS - Two-Tier Enrollment System Diagram

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIDYAKOSH LMS ENROLLMENT SYSTEM              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TIER 1: SCHOOL ENROLLMENT                │
│                    (School Access Management)                   │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────┐    Email Invitation    ┌─────────────┐
    │    ADMIN    │ ──────────────────────► │   STUDENT   │
    │             │                         │             │
    │ • Creates   │                         │ • Receives  │
    │   invitation│                         │   email     │
    │ • Sends via │                         │ • Signs up  │
    │   email     │                         │   with code │
    │ • Approves  │                         │             │
    │   access    │                         │             │
    └─────────────┘                         └─────────────┘
            │                                       │
            │                                       │
            ▼                                       ▼
    ┌─────────────────────────────────────────────────┐
    │              SCHOOL ACCESS GRANTED              │
    │         (Student can now access school)         │
    └─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       TIER 2: COURSE ENROLLMENT                 │
│                    (Course Access Management)                   │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────┐    Course Code        ┌─────────────┐
    │   TEACHER   │ ────────────────────► │   STUDENT   │
    │             │                       │             │
    │ • Creates   │                       │ • Uses code │
    │   course    │                       │   to join   │
    │   code      │                       │   course    │
    │ • Shares    │                       │             │
    │   code      │                       │             │
    └─────────────┘                       └─────────────┘
            │                                       │
            │                                       │
            ▼                                       ▼
    ┌─────────────────────────────────────────────────┐
    │             COURSE ACCESS GRANTED               │
    │        (Student can now access course)          │
    └─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        COMPLETE ACCESS                          │
│              (Student has both school + course access)          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 **Process Flow**

### **Phase 1: School Enrollment**
```
1. Admin → Creates invitation → Sends email
2. Student → Receives email → Signs up with code
3. Admin → Reviews → Approves school access
4. Student → Gains school access
```

### **Phase 2: Course Enrollment**
```
1. Teacher → Creates course → Generates enrollment code
2. Student → Uses code → Joins specific course
3. System → Automatically enrolls student
4. Student → Gains course access
```

## 📊 **Database Structure**

```
school_invitations
├── id (UUID)
├── school_id (UUID)
├── email (TEXT)
├── invitation_code (TEXT)
├── status (pending/accepted/expired)
└── created_at (TIMESTAMP)

profiles
├── id (UUID)
├── school_id (UUID)
├── school_access_granted (BOOLEAN)
├── role (admin/teacher/student)
└── created_at (TIMESTAMP)

course_enrollment_codes
├── id (UUID)
├── course_id (UUID)
├── code (TEXT)
├── max_uses (INTEGER)
└── created_at (TIMESTAMP)

enrollments
├── id (UUID)
├── course_id (UUID)
├── student_id (UUID)
└── enrolled_at (TIMESTAMP)
```

## 🎯 **User Roles & Responsibilities**

### **School Administrator (Admin)**
- ✅ Manages school invitations
- ✅ Approves student school access
- ✅ Oversees course enrollments
- ✅ Controls school-wide settings

### **Teacher**
- ✅ Creates course enrollment codes
- ✅ Manages their course enrollments
- ✅ Shares codes with students
- ✅ Tracks code usage

### **Student**
- ✅ Receives school invitations
- ✅ Signs up with invitation codes
- ✅ Uses course codes to join courses
- ✅ Accesses enrolled course content

## 🔐 **Access Control Levels**

### **Level 1: No Access**
- ❌ Cannot access school
- ❌ Cannot access courses
- ❌ Cannot see any content

### **Level 2: School Access Only**
- ✅ Can access school
- ❌ Cannot access courses
- ✅ Can see course list
- ✅ Can use course codes

### **Level 3: Full Access**
- ✅ Can access school
- ✅ Can access enrolled courses
- ✅ Can see course content
- ✅ Can participate in activities

## 🚀 **Key Benefits**

1. **Clear Separation** - School vs Course access
2. **Better Security** - Two-step verification
3. **Easier Management** - Role-based control
4. **No Confusion** - Clear naming and labels
5. **Scalable** - Works for any school size

**This two-tier system ensures proper access control and eliminates confusion between school and course enrollment!** 🎉
