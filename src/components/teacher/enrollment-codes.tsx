'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Plus, Trash2, Edit, Users, Clock, Link, Eye } from 'lucide-react'

interface EnrollmentCode {
  id: string
  code: string
  title: string
  description: string
  created_at: string
  expires_at?: string
  max_uses?: number
  current_uses: number
  is_active: boolean
  course: {
    id: string
    title: string
    description: string
  }
  created_by_profile: {
    full_name: string
    email: string
  }
  usage: Array<{
    id: string
    used_at: string
    student_profile: {
      full_name: string
      email: string
    }
  }>
}

interface Course {
  id: string
  title: string
  description: string
}

export default function EnrollmentCodes() {
  const [codes, setCodes] = useState<EnrollmentCode[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [newCodeOpen, setNewCodeOpen] = useState(false)
  const [editCodeOpen, setEditCodeOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<EnrollmentCode | null>(null)
  const [newCode, setNewCode] = useState({
    courseId: '',
    title: '',
    description: '',
    expiresInDays: 0,
    maxUses: 0
  })
  const [creating, setCreating] = useState(false)

  const fetchCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/enrollment-codes')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCodes(data.codes || [])
    } catch (error) {
      console.error('Error fetching enrollment codes:', error)
      setCodes([])
      alert(`Failed to load enrollment codes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    }
  }

  useEffect(() => {
    fetchCodes()
    fetchCourses()
  }, [])

  const createCode = async () => {
    if (!newCode.courseId) {
      alert('Please select a course')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/enrollment-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: newCode.courseId,
          title: newCode.title,
          description: newCode.description,
          expiresInDays: newCode.expiresInDays || null,
          maxUses: newCode.maxUses || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create enrollment code')
      }

      alert(`Enrollment code created successfully!\n\nCode: ${data.code.code}\nURL: ${data.enrollmentUrl}`)
      setNewCode({ courseId: '', title: '', description: '', expiresInDays: 0, maxUses: 0 })
      setNewCodeOpen(false)
      fetchCodes()
    } catch (error) {
      console.error('Error creating enrollment code:', error)
      alert(`Failed to create enrollment code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreating(false)
    }
  }

  const updateCode = async (codeId: string, updates: any) => {
    try {
      const response = await fetch(`/api/enrollment-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update enrollment code')
      }

      fetchCodes()
    } catch (error) {
      console.error('Error updating enrollment code:', error)
      alert(`Failed to update enrollment code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this enrollment code?')) {
      return
    }

    try {
      const response = await fetch(`/api/enrollment-codes/${codeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete enrollment code')
      }

      fetchCodes()
    } catch (error) {
      console.error('Error deleting enrollment code:', error)
      alert(`Failed to delete enrollment code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('Enrollment code copied to clipboard!')
  }

  const copyEnrollmentUrl = (code: string) => {
    const url = `${window.location.origin}/enroll?code=${code}`
    navigator.clipboard.writeText(url)
    alert('Enrollment URL copied to clipboard!')
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

  const getRemainingUses = (code: EnrollmentCode) => {
    if (!code.max_uses) return 'Unlimited'
    return Math.max(0, code.max_uses - code.current_uses)
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enrollment codes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Enrollment Codes</h2>
          <p className="text-gray-600">Create Discord-style invite codes for your courses</p>
        </div>
        <Dialog open={newCodeOpen} onOpenChange={setNewCodeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Enrollment Code</DialogTitle>
              <DialogDescription>
                Create a code that students can use to join your course
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Select
                  value={newCode.courseId}
                  onValueChange={(value) => setNewCode({ ...newCode, courseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Spring 2024 Enrollment"
                  value={newCode.title}
                  onChange={(e) => setNewCode({ ...newCode, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this enrollment code"
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expires">Expires In (days)</Label>
                <Input
                  id="expires"
                  type="number"
                  placeholder="0 for no expiration"
                  value={newCode.expiresInDays}
                  onChange={(e) => setNewCode({ ...newCode, expiresInDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="0 for unlimited"
                  value={newCode.maxUses}
                  onChange={(e) => setNewCode({ ...newCode, maxUses: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setNewCodeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCode} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Code'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Link className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No enrollment codes created</h3>
            <p className="text-gray-600 mb-4">
              Create your first enrollment code to allow students to join your courses.
            </p>
            <Button onClick={() => setNewCodeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {codes.map((code) => (
            <Card key={code.id} className={!code.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{code.title}</CardTitle>
                    <CardDescription>{code.course.title}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {code.is_active ? (
                      <Badge variant="default" className="text-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {isExpired(code.expires_at) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold">{code.code}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(code.code)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {code.description && (
                  <p className="text-sm text-gray-600">{code.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Uses</p>
                    <p className="text-gray-600">
                      {code.current_uses} / {code.max_uses || '∞'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Remaining</p>
                    <p className="text-gray-600">{getRemainingUses(code)}</p>
                  </div>
                </div>

                {code.expires_at && (
                  <div className="text-sm">
                    <p className="font-medium">Expires</p>
                    <p className="text-gray-600">{formatDate(code.expires_at)}</p>
                  </div>
                )}

                <div className="text-sm">
                  <p className="font-medium">Created</p>
                  <p className="text-gray-600">{formatDate(code.created_at)}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyEnrollmentUrl(code.code)}
                    className="flex-1"
                  >
                    <Link className="w-3 h-3 mr-1" />
                    Copy URL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCode(code)
                      setEditCodeOpen(true)
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteCode(code.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {code.usage.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="font-medium text-sm mb-2">Recent Usage</p>
                    <div className="space-y-2">
                      {code.usage.slice(0, 3).map((usage) => (
                        <div key={usage.id} className="flex items-center justify-between text-sm">
                          <span>{usage.student_profile.full_name}</span>
                          <span className="text-gray-500">{formatDate(usage.used_at)}</span>
                        </div>
                      ))}
                      {code.usage.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{code.usage.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Code Dialog */}
      <Dialog open={editCodeOpen} onOpenChange={setEditCodeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Enrollment Code</DialogTitle>
            <DialogDescription>
              Update the enrollment code settings
            </DialogDescription>
          </DialogHeader>
          {selectedCode && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedCode.title}
                  onChange={(e) => setSelectedCode({ ...selectedCode, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedCode.description}
                  onChange={(e) => setSelectedCode({ ...selectedCode, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-active">Status</Label>
                <Select
                  value={selectedCode.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setSelectedCode({ ...selectedCode, is_active: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditCodeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  updateCode(selectedCode.id, {
                    title: selectedCode.title,
                    description: selectedCode.description,
                    isActive: selectedCode.is_active
                  })
                  setEditCodeOpen(false)
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


