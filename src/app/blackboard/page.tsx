'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Users, 
  Calendar,
  BookOpen,
  PenTool,
  Eye,
  Share,
  Wifi,
  WifiOff,
  Play,
  Pause
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BlackboardCanvas } from '@/components/blackboard/blackboard-canvas'
import { useBlackboardCollaboration } from '@/hooks/useBlackboardCollaboration'

type Blackboard = Database['public']['Tables']['blackboards']['Row'] & {
  course?: {
    id: string
    title: string
  }
}

type Course = Database['public']['Tables']['courses']['Row']

interface DrawElement {
  type: 'pen' | 'rectangle' | 'circle' | 'text'
  points: { x: number; y: number }[]
  color: string
  strokeWidth: number
  text?: string
  id: string
}

export default function BlackboardPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [blackboards, setBlackboards] = useState<Blackboard[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [selectedBlackboard, setSelectedBlackboard] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    description: ''
  })

  useEffect(() => {
    // Allow teachers, admins, and students to access blackboards
    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin' && profile.role !== 'student')) {
      router.push('/dashboard')
      return
    }
    
    fetchData()
  }, [profile, router])

  const fetchData = async () => {
    try {
      console.log('Fetching data for profile:', {
        id: profile?.id,
        role: profile?.role,
        school_id: profile?.school_id
      })

      let coursesData = []
      
      if (profile?.role === 'student') {
        // For students, fetch courses they're enrolled in
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            course:courses(*)
          `)
          .eq('student_id', profile.id)

        if (enrollmentsError) {
          console.error('Error fetching student enrollments:', enrollmentsError)
        } else {
          coursesData = enrollmentsData?.map(e => e.course).filter(Boolean) || []
          console.log('Fetched student courses:', coursesData)
        }
      } else {
        // For teachers and admins, fetch courses in their school
        const { data: fetchedCourses, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('school_id', profile?.school_id)
          .order('title')

        if (coursesError) {
          console.error('Error fetching courses:', coursesError)
        } else {
          coursesData = fetchedCourses || []
          console.log('Fetched teacher/admin courses:', coursesData)
        }
      }

      setCourses(coursesData)

      // Fetch blackboards (RLS policies will handle access control)
      const { data: blackboardsData, error: blackboardsError } = await supabase
        .from('blackboards')
        .select(`
          *,
          course:courses(id, title)
        `)
        .order('updated_at', { ascending: false })

      if (blackboardsError) {
        console.error('Error fetching blackboards:', blackboardsError)
      } else {
        console.log('Fetched blackboards:', blackboardsData)
        setBlackboards(blackboardsData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.course_id) {
      console.log('Form validation failed:', { title: formData.title, course_id: formData.course_id })
      return
    }

    console.log('Creating blackboard with data:', {
      title: formData.title.trim(),
      course_id: formData.course_id,
      profile_id: profile?.id,
      profile_role: profile?.role
    })

    setCreating(true)
    try {
      // First, let's test if we can access the blackboards table at all
      console.log('Testing blackboards table access...')
      const { data: testData, error: testError } = await supabase
        .from('blackboards')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('Cannot access blackboards table:', testError)
        alert(`Cannot access blackboards table: ${testError.message}`)
        return
      }

      console.log('Blackboards table access test passed')

      // Check if the course exists and is accessible
      console.log('Checking course access...')
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, school_id')
        .eq('id', formData.course_id)
        .single()

      if (courseError) {
        console.error('Cannot access course:', courseError)
        alert(`Cannot access selected course: ${courseError.message}`)
        return
      }

      console.log('Course access confirmed:', courseData)

      // Now try to create the blackboard
      console.log('Attempting to create blackboard...')
      const insertData = {
        title: formData.title.trim(),
        course_id: formData.course_id,
        board_state: { 
          elements: [],
          description: formData.description,
          created_by: profile?.id
        }
      }

      console.log('Insert data:', insertData)

      let { data, error } = await supabase
        .from('blackboards')
        .insert(insertData)
        .select(`
          *,
          course:courses(id, title)
        `)
        .single()

      console.log('Insert result:', { data, error })

      // If the first attempt fails, try a simpler approach without the join
      if (error) {
        console.log('First attempt failed, trying simpler approach...')
        const simpleInsertData = {
          title: formData.title.trim(),
          course_id: formData.course_id,
          board_state: { 
            elements: [],
            description: formData.description,
            created_by: profile?.id
          }
        }

        const { data: simpleData, error: simpleError } = await supabase
          .from('blackboards')
          .insert(simpleInsertData)
          .select('*')
          .single()

        console.log('Simple insert result:', { data: simpleData, error: simpleError })

        if (simpleError) {
          console.error('Both attempts failed:', { original: error, simple: simpleError })
          console.error('Error details:', {
            original: {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            },
            simple: {
              message: simpleError.message,
              details: simpleError.details,
              hint: simpleError.hint,
              code: simpleError.code
            }
          })
          alert(`Failed to create blackboard: ${error.message || simpleError.message || 'Unknown error'}`)
          return
        } else {
          // Success with simple approach, now fetch the course data separately
          const { data: courseData } = await supabase
            .from('courses')
            .select('id, title')
            .eq('id', simpleData.course_id)
            .single()

          data = {
            ...simpleData,
            course: courseData
          }
          error = null
        }
      }

      if (error) {
        console.error('Error creating blackboard:', error)
        console.error('Error details:', {
          message: (error as any)?.message || 'Unknown error',
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code
        })
        alert(`Failed to create blackboard: ${(error as any)?.message || 'Unknown error'}`)
        return
      }

      console.log('Blackboard created successfully:', data)
      setBlackboards(prev => [data, ...prev])
      setFormData({ title: '', course_id: '', description: '' })
      setShowForm(false)
    } catch (error) {
      console.error('Unexpected error creating blackboard:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      alert(`Failed to create blackboard: ${(error as any)?.message || 'Unknown error'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!formData.title.trim()) return

    try {
      const { data, error } = await supabase
        .from('blackboards')
        .update({
          title: formData.title.trim(),
          board_state: { 
            elements: (blackboards.find(b => b.id === id)?.board_state as any)?.elements || [],
            description: formData.description,
            created_by: profile?.id
          }
        })
        .eq('id', id)
        .select(`
          *,
          course:courses(id, title)
        `)
        .single()

      if (error) {
        console.error('Error updating blackboard:', error)
        alert('Failed to update blackboard')
        return
      }

      setBlackboards(prev => prev.map(b => b.id === id ? data : b))
      setEditing(null)
      setFormData({ title: '', course_id: '', description: '' })
      setShowForm(false)
    } catch (error) {
      console.error('Error updating blackboard:', error)
      alert('Failed to update blackboard')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blackboard?')) return

    try {
      const { error } = await supabase
        .from('blackboards')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting blackboard:', error)
        alert('Failed to delete blackboard')
        return
      }

      setBlackboards(prev => prev.filter(b => b.id !== id))
      if (selectedBlackboard === id) {
        setSelectedBlackboard(null)
      }
    } catch (error) {
      console.error('Error deleting blackboard:', error)
      alert('Failed to delete blackboard')
    }
  }

  const startEdit = (blackboard: Blackboard) => {
    setEditing(blackboard.id)
    setShowForm(true)
    setFormData({
      title: blackboard.title || '',
      course_id: blackboard.course_id || '',
      description: (blackboard.board_state as any)?.description || ''
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setShowForm(false)
    setFormData({ title: '', course_id: '', description: '' })
  }

  const openBlackboard = (id: string) => {
    setSelectedBlackboard(id)
  }

  const closeBlackboard = () => {
    setSelectedBlackboard(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin' && profile.role !== 'student')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500 text-center">
              Only teachers, administrators, and students can access the blackboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isStudent = profile?.role === 'student'
  const isTeacherOrAdmin = profile?.role === 'teacher' || profile?.role === 'admin'

  // If a blackboard is selected, show the canvas view
  if (selectedBlackboard) {
    const blackboard = blackboards.find(b => b.id === selectedBlackboard)
    if (!blackboard) return null

    return (
      <BlackboardView 
        blackboard={blackboard}
        onClose={closeBlackboard}
        isStudent={isStudent}
        onSave={async (elements) => {
          if (isStudent) return // Students can't save changes
          
          const { error } = await supabase
            .from('blackboards')
            .update({
              board_state: { 
                elements,
                description: (blackboard.board_state as any)?.description || '',
                created_by: profile?.id
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedBlackboard)

          if (error) {
            console.error('Error saving blackboard:', error)
          } else {
            // Update local state
            setBlackboards(prev => prev.map(b => 
              b.id === selectedBlackboard 
                ? { ...b, board_state: { elements, description: (blackboard.board_state as any)?.description || '', created_by: profile?.id }, updated_at: new Date().toISOString() }
                : b
            ))
          }
        }}
      />
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interactive Blackboard</h1>
          <p className="text-gray-600 mt-1">
            {isStudent 
              ? 'View and interact with digital blackboards from your courses'
              : 'Create and collaborate on digital blackboards with real-time drawing'
            }
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Button
            onClick={() => {
              setShowForm(true)
              setFormData({ title: '', course_id: '', description: '' })
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Blackboard
          </Button>
        )}
      </div>

      {/* Create/Edit Form - Only for teachers and admins */}
      {isTeacherOrAdmin && (
        <AnimatePresence>
          {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenTool className="h-5 w-5 mr-2" />
                  {editing ? 'Edit Blackboard' : 'Create New Blackboard'}
                </CardTitle>
                <CardDescription>
                  {editing ? 'Update your blackboard settings' : 'Create a new interactive blackboard for your course'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editing ? (e) => { e.preventDefault(); handleUpdate(editing); } : handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter blackboard title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Course</Label>
                      <select
                        id="course"
                        value={formData.course_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required={!editing}
                      >
                        <option value="">Select a course</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the blackboard content..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={creating || !formData.title.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creating ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-spin" />
                          {editing ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editing ? 'Update Blackboard' : 'Create Blackboard'}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Blackboards List */}
      <div className="space-y-4">
        {blackboards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isStudent ? 'No Blackboards Available' : 'No Blackboards Yet'}
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {isStudent 
                  ? 'Your teachers haven\'t created any blackboards for your courses yet.'
                  : 'Create your first interactive blackboard to collaborate with your students.'
                }
              </p>
              {isTeacherOrAdmin && (
                <Button
                  onClick={() => {
                    setShowForm(true)
                    setFormData({ title: '', course_id: '', description: '' })
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blackboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          blackboards.map((blackboard) => (
            <motion.div
              key={blackboard.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        {blackboard.title}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {blackboard.course?.title || 'No course assigned'}
                        <span className="mx-2">•</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        Updated {new Date(blackboard.updated_at).toLocaleDateString()}
                      </CardDescription>
                      {(blackboard.board_state as any)?.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {(blackboard.board_state as any).description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBlackboard(blackboard.id)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {isStudent ? 'View' : 'Open'}
                      </Button>
                      {isTeacherOrAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(blackboard)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(blackboard.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <PenTool className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Interactive drawing canvas</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(blackboard.board_state as any)?.elements?.length || 0} drawing elements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// Blackboard View Component
function BlackboardView({ 
  blackboard, 
  onClose, 
  onSave,
  isStudent = false
}: { 
  blackboard: Blackboard
  onClose: () => void
  onSave: (elements: DrawElement[]) => void
  isStudent?: boolean
}) {
  const { elements, collaborators, isLoading, isConnected, updateElements, saveToDatabase } = useBlackboardCollaboration({
    blackboardId: blackboard.id,
    onElementsChange: (elements) => {
      // Handle real-time updates
    }
  })

  const handleSave = async (elementsToSave: DrawElement[]) => {
    const success = await saveToDatabase(elementsToSave)
    if (success) {
      onSave(elementsToSave)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading blackboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{blackboard.title}</h1>
            <p className="text-sm text-gray-600">
              {blackboard.course?.title} • {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Offline</span>
              </>
            )}
          </div>

          {/* Collaborators */}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collaborator, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
                    title={collaborator}
                  >
                    {collaborator.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center border-2 border-white">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

              {/* Canvas */}
              <div className="flex-1">
                <BlackboardCanvas
                  initialElements={elements}
                  onElementsChange={updateElements}
                  onSave={handleSave}
                  readOnly={isStudent}
                  className="h-full"
                />
              </div>
    </div>
  )
}
