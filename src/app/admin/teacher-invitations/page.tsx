'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  RefreshCw, 
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface TeacherInvitation {
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'expired'
  invitation_code: string
  expires_at: string
  created_at: string
  accepted_at?: string
  accepted_by?: string
  invited_by: string
  school: {
    id: string
    name: string
  }
  invited_by_profile: {
    full_name: string
    email: string
  }
}

interface TeacherApplication {
  id: string
  teacher_email: string
  teacher_name: string
  school_id: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
}

function SchoolCodeDisplay({ schoolId }: { schoolId: string }) {
  const [schoolCode, setSchoolCode] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchoolCode()
  }, [schoolId])

  const fetchSchoolCode = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/schools/info')
      if (response.ok) {
        const data = await response.json()
        setSchoolCode(data.school?.school_code || '')
      }
    } catch (error) {
      console.error('Error fetching school code:', error)
    } finally {
      setLoading(false)
    }
  }

  const copySchoolCode = async () => {
    try {
      await navigator.clipboard.writeText(schoolCode)
      toast.success('School code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy school code')
    }
  }

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-700">Loading school code...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!schoolCode) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Your School Code</h3>
            <p className="text-blue-700 mb-3">
              Share this code with teachers so they can apply directly to your school
            </p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-blue-900 font-mono bg-white px-4 py-2 rounded-lg border-2 border-blue-300">
                {schoolCode}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-100"
                onClick={copySchoolCode}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Code
              </Button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-600 mb-1">Alternative to Email Invites</div>
            <div className="text-xs text-blue-500">Teachers can apply directly with this code</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TeacherApplicationsTab({ 
  applications, 
  loading, 
  processing, 
  onApprove, 
  onReject, 
  onRefresh 
}: { 
  applications: TeacherApplication[]
  loading: boolean
  processing: string | null
  onApprove: (applicationId: string) => void
  onReject: (applicationId: string, reason?: string) => void
  onRefresh: () => void
}) {
  const { profile } = useAuth()

  const handleApprove = (applicationId: string) => {
    onApprove(applicationId)
  }

  const handleReject = (applicationId: string, reason?: string) => {
    onReject(applicationId, reason)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-700">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-700">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading teacher applications...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Teacher Applications
          </CardTitle>
          <CardDescription>
            Review and manage teacher applications for your school
          </CardDescription>
        </CardHeader>
      </Card>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600">
              Teacher applications will appear here when teachers apply to your school using the school code.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {applications.map((application) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.teacher_name}
                          </h3>
                          {getStatusBadge(application.status)}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {application.teacher_email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Applied on {new Date(application.created_at).toLocaleDateString()}
                          </div>
                          {application.message && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{application.message}</p>
                            </div>
                          )}
                          {application.rejection_reason && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700">
                                <strong>Rejection reason:</strong> {application.rejection_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {application.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(application.id)}
                            disabled={processing === application.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {processing === application.id ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(application.id)}
                            disabled={processing === application.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {processing === application.id ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default function TeacherInvitationsPage() {
  const { profile } = useAuth()
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([])
  const [applications, setApplications] = useState<TeacherApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    message: '',
    expiresInDays: 7
  })
  const [activeTab, setActiveTab] = useState('applications')
  const [showInvitationCodes, setShowInvitationCodes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchInvitations()
      fetchTeacherApplications()
    }
  }, [profile])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations/teachers')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
      } else {
        console.error('Failed to fetch teacher invitations:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to load teacher invitations')
      }
    } catch (error) {
      console.error('Error fetching teacher invitations:', error)
      toast.error('Error loading teacher invitations')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/teacher-applications')
      const data = await response.json()

      if (response.ok) {
        setApplications(data.applications || [])
      } else {
        toast.error('Failed to fetch teacher applications')
      }
    } catch (error) {
      console.error('Error fetching teacher applications:', error)
      toast.error('Failed to fetch teacher applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (applicationId: string) => {
    try {
      setProcessing(applicationId)
      const response = await fetch(`/api/admin/teacher-applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Teacher application approved successfully!')
        fetchTeacherApplications()
      } else {
        toast.error(data.error || 'Failed to approve application')
      }
    } catch (error) {
      console.error('Error approving application:', error)
      toast.error('Failed to approve application')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (applicationId: string, reason?: string) => {
    try {
      setProcessing(applicationId)
      const response = await fetch(`/api/admin/teacher-applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: reason }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Teacher application rejected')
        fetchTeacherApplications()
      } else {
        toast.error(data.error || 'Failed to reject application')
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application')
    } finally {
      setProcessing(null)
    }
  }

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/invitations/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newInvitation.email,
          message: newInvitation.message,
          expiresInDays: newInvitation.expiresInDays
        })
      })

      if (response.ok) {
        await response.json()
        toast.success(`Teacher invitation sent to ${newInvitation.email}`)
        setNewInvitation({ email: '', message: '', expiresInDays: 7 })
        setActiveTab('manage')
        await fetchInvitations()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create teacher invitation')
      }
    } catch (error) {
      console.error('Error creating teacher invitation:', error)
      toast.error('Failed to create teacher invitation')
    } finally {
      setCreating(false)
    }
  }

  const copyInvitationLink = async (invitation: TeacherInvitation) => {
    const invitationUrl = `${window.location.origin}/signup?invite=${invitation.invitation_code}`
    try {
      await navigator.clipboard.writeText(invitationUrl)
      toast.success('Teacher invitation link copied to clipboard')
    } catch (error) {
      console.error('Failed to copy invitation link:', error)
      toast.error('Failed to copy invitation link')
    }
  }

  const copyInvitationCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Teacher invitation code copied to clipboard')
    } catch (error) {
      console.error('Failed to copy invitation code:', error)
      toast.error('Failed to copy invitation code')
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this teacher invitation?')) return

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Teacher invitation deleted successfully')
        await fetchInvitations()
      } else {
        toast.error('Failed to delete teacher invitation')
      }
    } catch (error) {
      console.error('Error deleting teacher invitation:', error)
      toast.error('Failed to delete teacher invitation')
    }
  }

  const resendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Teacher invitation email resent successfully')
        await fetchInvitations()
      } else {
        toast.error('Failed to resend teacher invitation')
      }
    } catch (error) {
      console.error('Error resending teacher invitation:', error)
      toast.error('Failed to resend teacher invitation')
    }
  }

  const toggleShowCode = (invitationId: string) => {
    setShowInvitationCodes(prev => ({
      ...prev,
      [invitationId]: !prev[invitationId]
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt)
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can manage teacher invitations.</p>
        </div>
      </div>
    )
  }

  const pendingApplications = applications.filter(app => app.status === 'pending')
  const approvedApplications = applications.filter(app => app.status === 'approved')
  const rejectedApplications = applications.filter(app => app.status === 'rejected')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                  <Mail className="h-8 w-8 mr-3" />
                  Teacher Applications
                </h1>
                <p className="text-blue-100 text-lg">
                  Review and manage teacher applications for your school
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{applications.length}</div>
                <div className="text-blue-100 text-sm">Total Applications</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* School Code Display */}
      {profile?.school_id && (
        <SchoolCodeDisplay schoolId={profile.school_id} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-700">{pendingApplications.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-3xl font-bold text-green-700">{approvedApplications.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-3xl font-bold text-red-700">{rejectedApplications.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          {/* <TabsTrigger value="create" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Create Invitation
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Invitations
          </TabsTrigger> */}
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Teacher Applications
          </TabsTrigger>
        </TabsList>

        {/* <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Invite New Teacher
              </CardTitle>
              <CardDescription>
                Send an invitation email to a teacher to join your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createInvitation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Teacher Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newInvitation.email}
                      onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="teacher@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                    <Input
                      id="expiresInDays"
                      type="number"
                      min="1"
                      max="30"
                      value={newInvitation.expiresInDays || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsedValue = value === '' ? 7 : parseInt(value, 10);
                        setNewInvitation(prev => ({ 
                          ...prev, 
                          expiresInDays: isNaN(parsedValue) ? 7 : parsedValue 
                        }));
                      }}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Teacher Invitation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* <TabsContent value="manage" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-lg">Loading teacher invitations...</span>
                </div>
              </CardContent>
            </Card>
          ) : invitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teacher Invitations Yet</h3>
                <p className="text-gray-600 mb-4">Create your first teacher invitation to get started.</p>
                <Button onClick={() => setActiveTab('create')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Teacher Invitation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {invitations.map((invitation) => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Mail className="h-5 w-5 text-blue-500" />
                              <span className="font-semibold text-lg">{invitation.email}</span>
                              {getStatusBadge(invitation.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Created: {formatDate(invitation.created_at)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Expires: {formatDate(invitation.expires_at)}
                              </div>
                              {invitation.accepted_at && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Accepted: {formatDate(invitation.accepted_at)}
                                </div>
                              )}
                            </div>

                            {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Invitation Code:</span>
                                    <code className="px-2 py-1 bg-white border rounded text-sm">
                                      {showInvitationCodes[invitation.id] 
                                        ? invitation.invitation_code 
                                        : '••••••••'
                                      }
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleShowCode(invitation.id)}
                                    >
                                      {showInvitationCodes[invitation.id] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => copyInvitationCode(invitation.invitation_code)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyInvitationLink(invitation)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Copy Link
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resendInvitation(invitation.id)}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Resend
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteInvitation(invitation.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent> */}

        <TabsContent value="applications" className="space-y-6">
          <TeacherApplicationsTab 
            applications={applications}
            loading={loading}
            processing={processing}
            onApprove={handleApprove}
            onReject={handleReject}
            onRefresh={fetchTeacherApplications}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
