import { Metadata } from 'next'
import EmailDebug from '@/components/admin/email-debug'

export const metadata: Metadata = {
  title: 'Email Debug - Admin Dashboard',
  description: 'Debug email configuration and test email sending'
}

export default function EmailDebugPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email Debug</h1>
        <p className="text-gray-600 mt-1">
          Debug email configuration and test email sending functionality
        </p>
      </div>
      
      <EmailDebug />
    </div>
  )
}
