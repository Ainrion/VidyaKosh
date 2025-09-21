import { toast } from "sonner"

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

// Toast notification utility functions
export const showToast = {
  // Success notifications
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    })
  },

  // Error notifications
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    })
  },

  // Warning notifications
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    })
  },

  // Info notifications
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    })
  },

  // Loading notifications
  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
    })
  },

  // Dismiss loading toast
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId)
  },

  // Promise-based toast (shows loading, then success/error)
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    })
  }
}

// Predefined toast messages for common operations
export const toastMessages = {
  // Authentication
  auth: {
    signupSuccess: () => showToast.success(
      "Account created successfully!",
      "Please check your email for verification link"
    ),
    adminSignupSuccess: () => showToast.success(
      "Admin account created successfully!",
      "Your admin account is ready - you can login immediately!"
    ),
    teacherApplicationSuccess: () => showToast.success(
      "Application submitted successfully!",
      "Your teacher application has been sent to the admin for review."
    ),
    signupError: (error: string) => showToast.error(
      "Signup failed",
      error
    ),
    loginSuccess: () => showToast.success(
      "Welcome back!",
      "You have been logged in successfully"
    ),
    loginError: (error: string) => showToast.error(
      "Login failed",
      error
    ),
    logoutSuccess: () => showToast.info(
      "Logged out successfully",
      "You have been logged out"
    ),
    emailVerificationSent: () => showToast.info(
      "Verification email sent!",
      "Please check your inbox and click the verification link"
    ),
    emailVerificationSuccess: () => showToast.success(
      "Email verified successfully!",
      "Your account is now fully activated"
    ),
    emailVerificationError: () => showToast.error(
      "Email verification failed",
      "Please try again or contact support"
    ),
  },

  // Invitations
  invitations: {
    sent: (email: string) => showToast.success(
      "Invitation sent successfully!",
      `Invitation sent to ${email}`
    ),
    sendError: (error: string) => showToast.error(
      "Failed to send invitation",
      error
    ),
    accepted: () => showToast.success(
      "Invitation accepted!",
      "You have successfully joined the school"
    ),
    expired: () => showToast.warning(
      "Invitation expired",
      "Please request a new invitation"
    ),
    invalid: () => showToast.error(
      "Invalid invitation",
      "This invitation code is not valid"
    ),
  },

  // Enrollment
  enrollment: {
    enrolled: (courseName: string) => showToast.success(
      "Enrolled successfully!",
      `You are now enrolled in ${courseName}`
    ),
    enrollmentError: (error: string) => showToast.error(
      "Enrollment failed",
      error
    ),
    bulkEnrollmentSuccess: (count: number) => showToast.success(
      "Bulk enrollment completed",
      `${count} students enrolled successfully`
    ),
    bulkEnrollmentError: (error: string) => showToast.error(
      "Bulk enrollment failed",
      error
    ),
    enrollmentCodeGenerated: (code: string) => showToast.success(
      "Enrollment code generated!",
      `Code: ${code} - Share this with students`
    ),
    enrollmentCodeUsed: () => showToast.success(
      "Enrollment successful!",
      "You have joined the course using the enrollment code"
    ),
    enrollmentCodeInvalid: () => showToast.error(
      "Invalid enrollment code",
      "Please check the code and try again"
    ),
  },

  // Profile
  profile: {
    updated: () => showToast.success(
      "Profile updated successfully!",
      "Your changes have been saved"
    ),
    updateError: (error: string) => showToast.error(
      "Failed to update profile",
      error
    ),
  },

  // Courses
  courses: {
    created: (courseName: string) => showToast.success(
      "Course created successfully!",
      `${courseName} is now available`
    ),
    updated: (courseName: string) => showToast.success(
      "Course updated successfully!",
      `Changes to ${courseName} have been saved`
    ),
    deleted: (courseName: string) => showToast.success(
      "Course deleted successfully!",
      `${courseName} has been removed`
    ),
    createError: (error: string) => showToast.error(
      "Failed to create course",
      error
    ),
    updateError: (error: string) => showToast.error(
      "Failed to update course",
      error
    ),
    deleteError: (error: string) => showToast.error(
      "Failed to delete course",
      error
    ),
  },

  // Assignments
  assignments: {
    created: (title: string) => showToast.success(
      "Assignment created successfully!",
      `${title} has been assigned to students`
    ),
    submitted: (title: string) => showToast.success(
      "Assignment submitted!",
      `Your submission for ${title} has been received`
    ),
    graded: (title: string) => showToast.success(
      "Assignment graded!",
      `Grades for ${title} have been published`
    ),
    createError: (error: string) => showToast.error(
      "Failed to create assignment",
      error
    ),
    submitError: (error: string) => showToast.error(
      "Failed to submit assignment",
      error
    ),
  },

  // Exams
  exams: {
    created: (title: string) => showToast.success(
      "Exam created successfully!",
      `${title} is now available for students`
    ),
    started: (title: string) => showToast.info(
      "Exam started!",
      `You are now taking ${title}`
    ),
    submitted: (title: string) => showToast.success(
      "Exam submitted!",
      `Your answers for ${title} have been submitted`
    ),
    graded: (title: string) => showToast.success(
      "Exam graded!",
      `Results for ${title} are now available`
    ),
    createError: (error: string) => showToast.error(
      "Failed to create exam",
      error
    ),
    submitError: (error: string) => showToast.error(
      "Failed to submit exam",
      error
    ),
  },

  // General
  general: {
    saved: () => showToast.success(
      "Changes saved!",
      "Your changes have been saved successfully"
    ),
    deleted: (item: string) => showToast.success(
      "Deleted successfully!",
      `${item} has been removed`
    ),
    copied: (item: string) => showToast.success(
      "Copied to clipboard!",
      `${item} has been copied`
    ),
    networkError: () => showToast.error(
      "Network error",
      "Please check your internet connection and try again"
    ),
    serverError: () => showToast.error(
      "Server error",
      "Something went wrong. Please try again later"
    ),
    unauthorized: () => showToast.error(
      "Access denied",
      "You don't have permission to perform this action"
    ),
  }
}

// Hook for using toast notifications in components
export const useToast = () => {
  return {
    showToast,
    toastMessages,
  }
}

export default showToast
