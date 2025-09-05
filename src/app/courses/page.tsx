'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, BookOpen, Users, Calendar, MoreVertical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

type Course = Database['public']['Tables']['courses']['Row'] & {
  created_by_profile?: {
    full_name: string
  }
  enrollment_count?: number
}

export default function CoursesPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchCourses()
  }, [profile?.school_id])

  const fetchCourses = async () => {
    if (!profile?.school_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          created_by_profile:profiles!courses_created_by_fkey(full_name),
          enrollments(count)
        `)
        .eq('school_id', profile.school_id)
        .eq('archived', false)
        .order('created_at', { ascending: false })

      // Filter based on user role
      if (profile.role === 'teacher') {
        query = query.or(`created_by.eq.${profile.id}`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching courses:', error)
        // If it's an RLS error, show empty state
        if (error.message?.includes('406') || error.code === '42501') {
          console.log('RLS blocking courses access, showing empty state')
          setCourses([])
          return
        }
        throw error
      }

      const coursesWithCount = data?.map(course => ({
        ...course,
        enrollment_count: Array.isArray(course.enrollments) ? course.enrollments.length : 0
      })) || []

      setCourses(coursesWithCount)
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.school_id || !newCourse.title.trim()) return

    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          school_id: profile.school_id,
          created_by: profile.id
        })

      if (error) throw error

      setNewCourse({ title: '', description: '' })
      setShowCreateForm(false)
      fetchCourses()
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canCreateCourse = profile?.role === 'admin' || profile?.role === 'teacher'

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-1">
              {profile?.role === 'student' 
                ? 'Your enrolled courses' 
                : 'Manage and view courses'
              }
            </p>
          </div>
          {canCreateCourse && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Course</CardTitle>
              <CardDescription>Add a new course to your school</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter course title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter course description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Course</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm 
                  ? 'No courses match your search criteria.'
                  : canCreateCourse 
                    ? 'Get started by creating your first course.'
                    : 'No courses are available yet.'
                }
              </p>
              {canCreateCourse && !searchTerm && (
                <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCourseClick(course.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Created by {course.created_by_profile?.full_name || 'Unknown'}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Add dropdown menu logic here later
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.enrollment_count || 0} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCourseClick(course.id)
                      }}
                    >
                      View Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
