'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
// DashboardLayout is now handled globally in AppLayout
import { QuizBuilder } from '@/components/quiz/quiz-builder'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BookOpen, 
  Plus, 
  Target,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string | null
  student_count: number
  quiz_count: number
  created_at: string
  school_id: string
  created_by: string | null
  archived: boolean
}

export default function QuizBuilderPage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [showQuizBuilder, setShowQuizBuilder] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [profile])

  const fetchCourses = async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = () => {
    if (!selectedCourse) {
      toast.error('Please select a course first')
      return
    }
    setShowQuizBuilder(true)
  }

  const handleQuizSaved = (quiz: any) => {
    toast.success('Quiz created successfully!')
    setShowQuizBuilder(false)
    // Redirect to the course page to see the created quiz
    if (selectedCourse) {
      window.location.href = `/courses/${selectedCourse}`
    }
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only teachers and administrators can create quizzes.</p>
          </div>
        </div>    )
  }

  if (showQuizBuilder && selectedCourse) {
    return (
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create New Quiz</h1>
              <p className="text-gray-600">
                Course: {courses.find(c => c.id === selectedCourse)?.title}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowQuizBuilder(false)}
            >
              Back to Course Selection
            </Button>
          </div>
          
          <QuizBuilder
            courseId={selectedCourse}
            onQuizSaved={handleQuizSaved}
          />
        </div>    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Quiz Builder</h1>
          <p className="text-gray-600">Create quizzes and assessments for your courses</p>
        </div>

        {/* Course Selection */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Select Course</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose a course to create quiz for:</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Loading courses...</span>
                        </div>
                      </SelectItem>
                    ) : courses.length === 0 ? (
                      <SelectItem value="no-courses" disabled>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>No courses available</span>
                        </div>
                      </SelectItem>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.title}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleCreateQuiz}
                  disabled={!selectedCourse}
                  className="w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Course Overview */}
        {selectedCourse && (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Course Information</h3>
              
              {(() => {
                const course = courses.find(c => c.id === selectedCourse)
                if (!course) return null
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <BookOpen className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Course Title</p>
                        <p className="font-semibold">{course.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Users className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Enrolled Students</p>
                        <p className="font-semibold">{course.student_count}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                      <Target className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-600">Existing Quizzes</p>
                        <p className="font-semibold">{course.quiz_count}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <Clock className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-semibold">
                          {new Date(course.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })()}
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Description:</p>
                <p className="text-gray-800">
                  {courses.find(c => c.id === selectedCourse)?.description}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Quizzes Created</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Total Attempts</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, course) => sum + course.student_count, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, course) => sum + course.quiz_count, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Quizzes</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Features Overview */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Question Types</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Question Types</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Multiple Choice Questions</li>
                  <li>• True/False Questions</li>
                  <li>• Short Answer Questions</li>
                  <li>• Essay Questions</li>
                  <li>• Coding Questions</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Features</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Auto-grading for objective questions</li>
                  <li>• Time limits and attempt restrictions</li>
                  <li>• Instant results and feedback</li>
                  <li>• Performance analytics</li>
                  <li>• Multiple programming languages</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>  )
}
