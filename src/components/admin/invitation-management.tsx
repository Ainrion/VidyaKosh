'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, UserPlus, Copy, Trash2, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { toastMessages } from '@/lib/toast'

interface Invitation {
  id: string
  email: string
  invitation_code: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  created_at: string
  expires_at: string
  accepted_at?: string
  message?: string
  invited_by_profile: {
    full_name: string
    email: string
  }
  accepted_by_profile?: {
    full_name: string
    email: string
  }
  school: {
    name: string
  }
}

export default function InvitationManagement() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [newInvitationOpen, setNewInvitationOpen] = useState(false)
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    message: '',
    expiresInDays: 7
  })
  const [sending, setSending] = useState(false)

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      
      // Try the main API first
      let response = await fetch(`/api/invitations?status=${statusFilter}`)
      
      // If main API fails, try the simple fallback
      if (!response.ok) {
        console.log('Main invitations API failed, trying simple fallback...')
        response = await fetch(`/api/invitations-simple?status=${statusFilter}`)
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      setInvitations([])
      alert(`Failed to load invitations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [statusFilter])

  const sendInvitation = async () => {
    if (!newInvitation.email.trim()) {
      toastMessages.invitations.sendError('Please enter an email address')
      return
    }

    try {
      setSending(true)
      
      // Try the main API first
      let response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvitation)
      })

      // If main API fails, try the simple fallback
      if (!response.ok) {
        console.log('Main invitation creation API failed, trying simple fallback...')
        response = await fetch('/api/invitations-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newInvitation)
        })
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      // Check if email was actually sent
      if (data.emailSent) {
        toastMessages.invitations.sent(newInvitation.email)
      } else {
        console.error('Email sending failed:', data.emailError)
        toastMessages.invitations.sendError(
          data.emailError || 'Email could not be sent. Please check your email configuration.'
        )
      }

      setNewInvitation({ email: '', message: '', expiresInDays: 7 })
      setNewInvitationOpen(false)
      fetchInvitations()
    } catch (error) {
      console.error('Error sending invitation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toastMessages.invitations.sendError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const updateInvitationStatus = async (invitationId: string, status: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update invitation')
      }

      fetchInvitations()
    } catch (error) {
      console.error('Error updating invitation:', error)
      alert(`Failed to update invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) {
      return
    }

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete invitation')
      }

      fetchInvitations()
    } catch (error) {
      console.error('Error deleting invitation:', error)
      alert(`Failed to delete invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const copyInvitationUrl = (code: string) => {
    const url = `${window.location.origin}/signup?invite=${code}`
    navigator.clipboard.writeText(url)
    alert('Invitation URL copied to clipboard!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'accepted':
        return <Badge variant="default" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case 'expired':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
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

  const getStats = () => {
    const total = invitations.length
    const pending = invitations.filter(i => i.status === 'pending').length
    const accepted = invitations.filter(i => i.status === 'accepted').length
    const expired = invitations.filter(i => i.status === 'expired').length

    return { total, pending, accepted, expired }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">School Invitations</h2>
          <p className="text-gray-600">Send email invitations to students to join your school</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newInvitationOpen} onOpenChange={setNewInvitationOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/debug-invitations')
                const data = await response.json()
                console.log('Debug invitations data:', data)
                
                if (data.success) {
                  const { school_invitations, profiles, schools } = data.tables
                  alert(`Invitation System Debug:\n\n` +
                    `User: ${data.user.full_name} (${data.user.role})\n` +
                    `School ID: ${data.user.school_id}\n\n` +
                    `Tables:\n` +
                    `- school_invitations: ${school_invitations.exists ? '✅' : '❌'} (${school_invitations.count} records)\n` +
                    `- profiles: ${profiles.exists ? '✅' : '❌'} (${profiles.count} records)\n` +
                    `- schools: ${schools.exists ? '✅' : '❌'} (${schools.count} records)\n\n` +
                    `Check console for detailed data.`)
                } else {
                  alert(`Debug failed: ${data.error}`)
                }
              } catch (error) {
                console.error('Debug error:', error)
                alert('Debug failed. Check console for details.')
              }
            }}
          >
            Debug System
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/debug-invitations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: 'test@example.com' })
                })
                const data = await response.json()
                console.log('Debug invitation creation:', data)
                
                if (data.success && data.overallSuccess) {
                  alert(`Invitation Creation Test: ✅ SUCCESS\n\n` +
                    `All steps completed successfully:\n` +
                    `- Code Generation: ✅\n` +
                    `- Code Uniqueness: ✅\n` +
                    `- Invitation Creation: ✅\n\n` +
                    `Check console for detailed results.`)
                } else {
                  alert(`Invitation Creation Test: ❌ FAILED\n\n` +
                    `Check console for detailed error information.`)
                }
              } catch (error) {
                console.error('Debug creation error:', error)
                alert('Debug creation test failed. Check console for details.')
              }
            }}
          >
            Test Creation
          </Button>
        </div>
      </div>

      <Dialog open={newInvitationOpen} onOpenChange={setNewInvitationOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Student Invitation</DialogTitle>
              <DialogDescription>
                Send an email invitation to a student to join your school
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={newInvitation.email}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Welcome to our school! Use this invitation to create your account."
                  value={newInvitation.message}
                  onChange={(e) => setNewInvitation({ ...newInvitation, message: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expires">Expires In</Label>
                <Select
                  value={newInvitation.expiresInDays.toString()}
                  onValueChange={(value) => setNewInvitation({ ...newInvitation, expiresInDays: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setNewInvitationOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendInvitation} disabled={sending}>
                  {sending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Accepted</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No invitations found</h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'all' 
                    ? 'No invitations have been sent yet.' 
                    : `No ${statusFilter} invitations found.`
                  }
                </p>
                {statusFilter === 'all' && (
                  <Button onClick={() => setNewInvitationOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send First Invitation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{invitation.email}</h3>
                          {getStatusBadge(invitation.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Code:</strong> {invitation.invitation_code}</p>
                          <p><strong>Sent:</strong> {formatDate(invitation.created_at)}</p>
                          <p><strong>Expires:</strong> {formatDate(invitation.expires_at)}</p>
                          {invitation.accepted_at && (
                            <p><strong>Accepted:</strong> {formatDate(invitation.accepted_at)}</p>
                          )}
                          {invitation.message && (
                            <p><strong>Message:</strong> {invitation.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {invitation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInvitationUrl(invitation.invitation_code)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy URL
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInvitationStatus(invitation.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteInvitation(invitation.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

