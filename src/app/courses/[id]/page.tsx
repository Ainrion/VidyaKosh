'use client'

// DashboardLayout is now handled globally in AppLayout
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  FileText, 
  Plus,
  UserPlus,
  Edit,
  Paperclip
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { useRouter, useParams } from 'next/navigation'
import { FileUpload } from '@/components/ui/file-upload'

type Course = Database['public']['Tables']['courses']['Row'] & {
  created_by_profile?: {
    full_name: string
    email: string
  }
}

type Enrollment = Database['public']['Tables']['enrollments']['Row'] & {
  student_profile: {
    full_name: string
    email: string
  }
}

type Assignment = Database['public']['Tables']['assignments']['Row']

export default function CourseDetailsPage() {
  const { profile } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    due_date: '',
    points: ''
  })
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editCourse, setEditCourse] = useState({
    title: '',
    description: ''
  })
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const fetchCourseDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          created_by_profile:profiles!courses_created_by_fkey(full_name, email)
        `)
        .eq('id', courseId)
        .eq('school_id', profile?.school_id)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
      router.push('/courses')
    }
  }, [courseId, profile?.school_id, supabase, router])

  const fetchEnrollments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          student_profile:profiles!enrollments_student_id_fkey(full_name, email)
        `)
        .eq('course_id', courseId)

      if (error) throw error
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  }, [courseId, supabase])

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }, [courseId, supabase])

  const checkEnrollment = useCallback(async () => {
    if (profile?.role !== 'student') return

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', profile.id)
        .single()

      if (data) setIsEnrolled(true)
    } catch {
      // Not enrolled or error occurred
      setIsEnrolled(false)
    }
  }, [courseId, profile?.role, profile?.id, supabase])

  // Old enrollment functionality removed - students now use enrollment codes

  const createAssignment = async () => {
    if (!newAssignment.title.trim()) return

    setIsCreating(true)
    try {
      let fileData = null

      // Upload file if one is selected
      if (assignmentFile) {
        setIsUploadingFile(true)
        const formData = new FormData()
        formData.append('file', assignmentFile)
        formData.append('courseId', courseId)

        const uploadResponse = await fetch('/api/assignments/upload-file', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Failed to upload file')
        }

        const uploadData = await uploadResponse.json()
        fileData = uploadData.file
        setIsUploadingFile(false)
      }

      // Create assignment with file data
      const assignmentData = {
        course_id: courseId,
        title: newAssignment.title.trim(),
        description: newAssignment.description.trim() || null,
        due_date: newAssignment.due_date || null,
        points: newAssignment.points ? parseInt(newAssignment.points) : null,
        created_by: profile?.id
      }

      // Attachments are currently not supported in assignments table

      console.log('Creating assignment with data:', assignmentData)

      const { data: newAssignmentData, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        throw new Error(`Database error: ${error.message || 'Unknown error'}`)
      }

      console.log('Assignment created successfully:', newAssignmentData)

      // Reset form and close dialog
      setNewAssignment({
        title: '',
        description: '',
        due_date: '',
        points: ''
      })
      setAssignmentFile(null)
      setIsCreateDialogOpen(false)
      
      // Refresh assignments
      fetchAssignments()
    } catch (error) {
      console.error('Error creating assignment:', error)
      console.error('Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
        cause: (error as any)?.cause
      })
      
      // Show user-friendly error message
      alert(`Failed to create assignment: ${(error as any)?.message || 'Unknown error occurred'}`)
      setIsUploadingFile(false)
    } finally {
      setIsCreating(false)
    }
  }

  const updateCourse = async () => {
    if (!editCourse.title.trim()) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: editCourse.title.trim(),
          description: editCourse.description.trim() || null
        })
        .eq('id', courseId)

      if (error) throw error

      // Update local state
      setCourse(prev => prev ? {
        ...prev,
        title: editCourse.title.trim(),
        description: editCourse.description.trim() || null
      } : null)

      // Close dialog
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating course:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openEditDialog = () => {
    if (course) {
      setEditCourse({
        title: course.title,
        description: course.description || ''
      })
      setIsEditDialogOpen(true)
    }
  }

  const canManageCourse = profile?.role === 'admin' || 
    (profile?.role === 'teacher' && course?.created_by === profile.id)

  useEffect(() => {
    if (courseId && profile?.school_id) {
      fetchCourseDetails()
      fetchEnrollments()
      fetchAssignments()
      checkEnrollment()
    }
  }, [courseId, profile?.school_id, fetchCourseDetails, fetchEnrollments, fetchAssignments, checkEnrollment])

  if (loading) {
    return (
      <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>    )
  }

  if (!course) {
    return (
      <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
            <Button onClick={() => router.push('/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>    )
  }

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/courses')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-1">
              Created by {course.created_by_profile?.full_name || 'Unknown'}
            </p>
          </div>
          {canManageCourse && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openEditDialog}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Edit Course</DialogTitle>
                  <DialogDescription>
                    Update the course title and description.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Course Title</Label>
                    <Input
                      id="edit-title"
                      placeholder="Enter course title"
                      value={editCourse.title}
                      onChange={(e) => setEditCourse(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter course description"
                      value={editCourse.description}
                      onChange={(e) => setEditCourse(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={updateCourse} 
                    disabled={!editCourse.title.trim() || isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Course'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {profile?.role === 'student' && !isEnrolled && (
            <Button onClick={() => window.location.href = '/enroll'}>
              <UserPlus className="h-4 w-4 mr-2" />
              Join with Code
            </Button>
          )}
        </div>

        {/* Course Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {course.description || 'No description available for this course.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {enrollments.length} student{enrollments.length !== 1 ? 's' : ''} enrolled
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Created {new Date(course.created_at).toLocaleDateString()}
                </span>
              </div>
              {profile?.role === 'student' && isEnrolled && (
                <Badge variant="secondary" className="w-full justify-center">
                  Enrolled
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            {canManageCourse && (
              <TabsTrigger value="settings">Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Assignments</h3>
              {canManageCourse && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Create New Assignment</DialogTitle>
                      <DialogDescription>
                        Create a new assignment for this course. Students will be able to view and submit their work.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Assignment Title</Label>
                        <Input
                          id="title"
                          placeholder="Enter assignment title"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          placeholder="Enter assignment description and instructions"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="due_date">Due Date (Optional)</Label>
                          <Input
                            id="due_date"
                            type="datetime-local"
                            value={newAssignment.due_date}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="points">Points (Optional)</Label>
                          <Input
                            id="points"
                            type="number"
                            placeholder="100"
                            value={newAssignment.points}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, points: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="attachment">Assignment File (Optional)</Label>
                        <FileUpload
                          onFileSelect={(file) => setAssignmentFile(file)}
                          onFileRemove={() => setAssignmentFile(null)}
                          acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif']}
                          maxSizeMB={25}
                          disabled={isCreating || isUploadingFile}
                          placeholder="Upload assignment file (PDF, Word, Excel, Images)"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={createAssignment} 
                        disabled={!newAssignment.title.trim() || isCreating || isUploadingFile}
                      >
                        {isUploadingFile ? 'Uploading File...' : isCreating ? 'Creating...' : 'Create Assignment'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                  <p className="text-gray-500 text-center">
                    {canManageCourse 
                      ? 'Create your first assignment to get started.'
                      : 'No assignments have been posted yet.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <CardDescription>
                            Due: {assignment.due_date 
                              ? new Date(assignment.due_date).toLocaleDateString()
                              : 'No due date'
                            }
                          </CardDescription>
                        </div>
                        <Badge variant={assignment.due_date && new Date(assignment.due_date) < new Date() ? 'destructive' : 'default'}>
                          {assignment.due_date && new Date(assignment.due_date) < new Date() ? 'Overdue' : 'Active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">
                        {assignment.description || 'No description provided.'}
                      </p>
                      {/* Attachments are currently not supported in assignments table */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/assignments/${assignment.id}`)}
                      >
                        View Assignment
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Enrolled Students</h3>
              <span className="text-sm text-gray-500">
                {enrollments.length} student{enrollments.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {enrollments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                  <p className="text-gray-500 text-center">
                    Students will appear here once they enroll in this course.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {enrollment.student_profile.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{enrollment.student_profile.full_name}</p>
                          <p className="text-sm text-gray-500">{enrollment.student_profile.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {canManageCourse && (
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Settings</CardTitle>
                  <CardDescription>
                    Manage course settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Archive Course</h4>
                        <p className="text-sm text-gray-500">
                          Archive this course to hide it from students
                        </p>
                      </div>
                      <Button variant="outline">Archive</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Delete Course</h4>
                        <p className="text-sm text-gray-500">
                          Permanently delete this course and all its data
                        </p>
                      </div>
                      <Button variant="destructive">Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>  )
}
