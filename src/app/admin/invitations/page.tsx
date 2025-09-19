import { Metadata } from 'next'
import InvitationManagement from '@/components/admin/invitation-management'
import EmailConfigChecker from '@/components/admin/email-config-checker'

export const metadata: Metadata = {
  title: 'Student Invitations - Admin Dashboard',
  description: 'Manage student invitations and school access'
}

export default function AdminInvitationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <EmailConfigChecker />
      <InvitationManagement />
    </div>
  )
}

