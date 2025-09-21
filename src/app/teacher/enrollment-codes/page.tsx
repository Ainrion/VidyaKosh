import { Metadata } from 'next'
import EnrollmentCodes from '@/components/teacher/enrollment-codes'

export const metadata: Metadata = {
  title: 'Enrollment Codes - Teacher Dashboard',
  description: 'Create and manage enrollment codes for your courses'
}

export default function TeacherEnrollmentCodesPage() {
  return (
    <div className="container mx-auto py-6">
      <EnrollmentCodes />
    </div>
  )
}

