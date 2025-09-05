'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = useAuth()
  const router = useRouter()
  const [courseId, setCourseId] = useState<string>('')
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const supabase = createClient()

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setCourseId(id)
      fetchCourse(id)
    }
    getParams()
  }, [params])

  const fetchCourse = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching course:', error)
        alert('Failed to fetch course details')
        router.push('/courses')
        return
      }

      setCourse(data)
      setFormData({
        title: data.title || '',
        description: data.description || ''
      })
    } catch (error) {
      console.error('Error fetching course:', error)
      alert('Failed to fetch course details')
      router.push('/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !formData.title.trim()) return

    // Check if user has permission to edit this course
    if (profile?.role !== 'admin' && course?.created_by !== profile?.id) {
      alert('You do not have permission to edit this course')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)

      if (error) {
        console.error('Error updating course:', error)
        alert(`Error updating course: ${error.message}`)
        return
      }

      alert('Course updated successfully!')
      router.push(`/courses/${courseId}`)
    } catch (error) {
      console.error('Error updating course:', error)
      alert('Failed to update course')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/courses/${courseId}`)
  }

  // Check if user has permission to edit this course
  const canEdit = profile?.role === 'admin' || course?.created_by === profile?.id

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/courses')}>
              Back to Courses
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You do not have permission to edit this course.</p>
            <Button onClick={() => router.push(`/courses/${courseId}`)}>
              Back to Course
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push(`/courses/${courseId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-gray-600 mt-1">Update course information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>
              Update the course title and description. Changes will be saved immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter course title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter course description"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Course Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Course ID:</span>
                <p className="text-gray-600">{course.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-600">
                  {new Date(course.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <p className="text-gray-600">
                  {course.updated_at 
                    ? new Date(course.updated_at).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <p className="text-gray-600">
                  {course.archived ? 'Archived' : 'Active'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
