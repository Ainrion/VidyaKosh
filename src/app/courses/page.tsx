'use client'

// DashboardLayout is now handled globally in AppLayout
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, BookOpen, Users, Calendar, MoreVertical, Star, Clock, TrendingUp, Award, Filter, Grid, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterBy, setFilterBy] = useState('all')
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: ''
  })
  const [isCreating, setIsCreating] = useState(false)
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
    
    if (!profile?.school_id || !newCourse.title.trim()) {
      alert('Please fill in the course title')
      return
    }

    if (!profile?.id) {
      alert('User profile not found. Please try logging in again.')
      return
    }

    setIsCreating(true)
    try {
      console.log('Creating course with data:', {
        title: newCourse.title.trim(),
        description: newCourse.description.trim(),
        school_id: profile.school_id,
        created_by: profile.id
      })

      // Create the course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: newCourse.title.trim(),
          description: newCourse.description.trim() || null,
          school_id: profile.school_id,
          created_by: profile.id
        })
        .select()
        .single()

      if (courseError) {
        console.error('Course creation error:', courseError)
        alert(`Failed to create course: ${courseError.message}`)
        return
      }

      console.log('Course created successfully:', courseData)

      // Generate enrollment code for the course
      try {
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_enrollment_code')

        if (codeError) {
          console.error('Error generating enrollment code:', codeError)
          // Continue without code - course is still created
        } else {
          // Create enrollment code for the course
          const { error: createCodeError } = await supabase
            .from('course_enrollment_codes')
            .insert({
              course_id: courseData.id,
              code: codeData,
              created_by: profile.id,
              title: `${newCourse.title.trim()} Enrollment Code`,
              description: `Join ${newCourse.title.trim()} using this code`,
              is_active: true
            })

          if (createCodeError) {
            console.error('Error creating enrollment code:', createCodeError)
            // Continue without code - course is still created
          } else {
            console.log(`Enrollment code ${codeData} created for course ${newCourse.title.trim()}`)
          }
        }
      } catch (codeError) {
        console.error('Error in enrollment code generation:', codeError)
        // Continue without code - course is still created
      }

      // Add to local state and refresh the list
      setCourses(prev => [{ ...courseData, enrollment_count: 0 }, ...prev])
      setNewCourse({ title: '', description: '' })
      setShowCreateForm(false)
      
      // Show success message
      alert('Course created successfully!')
      
      // Refresh the courses list to ensure we have the latest data
      await fetchCourses()
      
    } catch (error) {
      console.error('Error creating course:', error)
      alert(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  const canCreateCourse = profile?.role === 'admin' || profile?.role === 'teacher'

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterBy === 'all') return matchesSearch
    if (filterBy === 'my-courses' && profile?.role === 'teacher') {
      return matchesSearch && course.created_by === profile.id
    }
    if (filterBy === 'popular') {
      return matchesSearch && (course.enrollment_count || 0) > 5
    }
    
    return matchesSearch
  })

  const courseColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600', 
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
              backgroundSize: '60px 60px',
              backgroundPosition: '0 0, 30px 30px'
            }}></div>
          </div>
          <div className="relative px-6 py-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-7xl mx-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                    <BookOpen className="h-10 w-10 mr-3 text-yellow-300" />
                    Courses
                  </h1>
                  <p className="text-blue-100 text-lg">
                    {profile?.role === 'student' ? 'Explore and join courses' : 'Manage your courses and create new ones'}
                  </p>
                </div>
                {canCreateCourse && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Course
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Create Course Form */}
            <AnimatePresence>
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2">
                        <Plus className="h-5 w-5 text-blue-600" />
                        <span>Create New Course</span>
                      </CardTitle>
                      <CardDescription>Add a new course to your school</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={createCourse} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium text-gray-700">Course Title</Label>
                            <Input
                              id="title"
                              value={newCourse.title}
                              onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Enter course title"
                              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                            <Textarea
                              id="description"
                              value={newCourse.description}
                              onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter course description"
                              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <Button 
                            type="submit"
                            disabled={isCreating}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
                          >
                            {isCreating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                              </>
                            ) : (
                              'Create Course'
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowCreateForm(false)}
                            disabled={isCreating}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
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

            {/* Search and Filters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Filter Dropdown */}
                      <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white text-sm"
                      >
                        <option value="all">All Courses</option>
                        {profile?.role === 'teacher' && <option value="my-courses">My Courses</option>}
                        <option value="popular">Popular</option>
                      </select>

                      {/* View Mode Toggle */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-md transition-all duration-200 ${
                            viewMode === 'grid' 
                              ? 'bg-white shadow-sm text-blue-600' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Grid className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-md transition-all duration-200 ${
                            viewMode === 'list' 
                              ? 'bg-white shadow-sm text-blue-600' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <List className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Course Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              {[
                { label: 'Total Courses', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'My Courses', value: courses.filter(c => c.created_by === profile?.id).length, icon: Star, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Total Enrollments', value: courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Active This Month', value: courses.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </motion.div>

            {/* Courses Grid/List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {loading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="border-0 shadow-lg animate-pulse">
                      <CardHeader className="pb-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          <div className="flex justify-between items-center pt-4">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredCourses.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                      <BookOpen className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {searchTerm 
                        ? 'No courses match your search criteria. Try adjusting your search terms.'
                        : canCreateCourse 
                          ? 'Get started by creating your first course and building an amazing learning experience.'
                          : 'No courses are available yet. Check back later or contact your administrator.'
                      }
                    </p>
                    {canCreateCourse && !searchTerm && (
                      <Button 
                        onClick={() => setShowCreateForm(true)} 
                        className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Course
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  <AnimatePresence>
                    {filteredCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                      >
                        <Card 
                          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                          onClick={() => handleCourseClick(course.id)}
                        >
                          {/* Course Header with Gradient */}
                          <div className={`h-20 bg-gradient-to-r ${courseColors[index % courseColors.length]} relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="absolute top-4 right-4">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                                <BookOpen className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </div>
                          
                          <CardHeader className="pb-4 -mt-6 relative z-10">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {course.title}
                              </CardTitle>
                              <CardDescription className="mt-2 text-gray-600">
                                Created by {course.created_by_profile?.full_name || 'Unknown'}
                              </CardDescription>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            {course.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                {course.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{course.enrollment_count || 0} students</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(course.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {(course.enrollment_count || 0) > 10 && (
                                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Popular
                                  </div>
                                )}
                                {course.created_by === profile?.id && (
                                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Mine
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
  )
}