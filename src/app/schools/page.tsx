'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Building2, Users, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface School {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  created_at: string
  _count?: {
    profiles: number
  }
}

export default function SchoolsPage() {
  const { profile } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: ''
  })

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/schools')
      
      if (!response.ok) {
        throw new Error('Failed to fetch schools')
      }
      
      const data = await response.json()
      setSchools(data.schools || [])
    } catch (error) {
      console.error('Error fetching schools:', error)
      toast.error('Failed to fetch schools')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchSchools()
    }
  }, [profile?.role, fetchSchools])

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create school')
      }

      const data = await response.json()
      setSchools(prev => [data.school, ...prev])
      setShowCreateDialog(false)
      setFormData({ name: '', address: '', phone: '', email: '', logo_url: '' })
      toast.success('School created successfully')
    } catch (error) {
      console.error('Error creating school:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create school')
    }
  }

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchool) return

    try {
      const response = await fetch(`/api/schools/${selectedSchool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update school')
      }

      const data = await response.json()
      setSchools(prev => prev.map(school => 
        school.id === selectedSchool.id ? data.school : school
      ))
      setShowEditDialog(false)
      setSelectedSchool(null)
      setFormData({ name: '', address: '', phone: '', email: '', logo_url: '' })
      toast.success('School updated successfully')
    } catch (error) {
      console.error('Error updating school:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update school')
    }
  }

  const handleDeleteSchool = async (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete school')
      }

      setSchools(prev => prev.filter(school => school.id !== schoolId))
      toast.success('School deleted successfully')
    } catch (error) {
      console.error('Error deleting school:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete school')
    }
  }

  const openEditDialog = (school: School) => {
    setSelectedSchool(school)
    setFormData({
      name: school.name,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      logo_url: school.logo_url || ''
    })
    setShowEditDialog(true)
  }

  if (profile?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You need administrator privileges to access school management.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">School Management</h1>
            <p className="text-gray-600">Manage all schools in the system</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create School
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New School</DialogTitle>
                <DialogDescription>
                  Add a new school to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div>
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter school name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter school address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="Enter logo URL"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create School</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading schools...</p>
          </div>
        ) : schools.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Schools Found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first school.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First School
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <Card key={school.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {school.name}
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(school.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(school)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSchool(school.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {school.address && (
                      <p className="text-sm text-gray-600">
                        📍 {school.address}
                      </p>
                    )}
                    {school.phone && (
                      <p className="text-sm text-gray-600">
                        📞 {school.phone}
                      </p>
                    )}
                    {school.email && (
                      <p className="text-sm text-gray-600">
                        ✉️ {school.email}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {school._count?.profiles || 0} users
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit School</DialogTitle>
              <DialogDescription>
                Update school information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSchool} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">School Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter school name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter school address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-logo_url">Logo URL</Label>
                <Input
                  id="edit-logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="Enter logo URL"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update School</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
