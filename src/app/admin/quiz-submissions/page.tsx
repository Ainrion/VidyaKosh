'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Users, TrendingUp, Clock, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface QuizSubmission {
  id: string
  score: number
  submitted_at: string
  quiz_id: string
  student_id: string
  quizzes: {
    id: string
    title: string
    course_id: string
    courses: {
      id: string
      title: string
      school_id: string
      created_by: string
    }
  }
  profiles?: {
    full_name: string
    email: string
  }
}

interface Course {
  id: string
  title: string
  school_id: string
}

export default function QuizSubmissionsPage() {
  const { profile } = useAuth()
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredSubmissions, setFilteredSubmissions] = useState<QuizSubmission[]>([])

  // Fetch courses for filtering
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  // Fetch quiz submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const url = selectedCourse && selectedCourse !== 'all'
        ? `/api/quiz-submissions?courseId=${selectedCourse}`
        : '/api/quiz-submissions'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      } else {
        toast.error('Failed to fetch quiz submissions')
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to fetch quiz submissions')
    } finally {
      setLoading(false)
    }
  }

  // Filter submissions based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSubmissions(submissions)
    } else {
      const filtered = submissions.filter(submission =>
        submission.quizzes.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (submission.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        submission.quizzes.courses.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSubmissions(filtered)
    }
  }, [submissions, searchTerm])

  // Fetch data on component mount and when course filter changes
  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    fetchSubmissions()
  }, [selectedCourse])

  // Calculate statistics
  const totalSubmissions = filteredSubmissions.length
  const averageScore = totalSubmissions > 0 
    ? (filteredSubmissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions).toFixed(1)
    : 0
  const uniqueStudents = new Set(filteredSubmissions.map(s => s.student_id)).size
  const uniqueQuizzes = new Set(filteredSubmissions.map(s => s.quiz_id)).size

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to view quiz submissions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Submissions</h1>
          <p className="text-gray-600 mt-1">View and manage student quiz submissions</p>
        </div>
        <Link href="/courses">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageScore}</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueStudents}</p>
                <p className="text-sm text-gray-600">Unique Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueQuizzes}</p>
                <p className="text-sm text-gray-600">Unique Quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by quiz, student, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Submissions</CardTitle>
          <CardDescription>
            {selectedCourse && selectedCourse !== 'all'
              ? `Submissions for ${courses.find(c => c.id === selectedCourse)?.title || 'selected course'}`
              : 'All quiz submissions'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading submissions...</p>
              </div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCourse 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No quiz submissions have been made yet.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{submission.quizzes.title}</h3>
                          <Badge variant="secondary">{submission.quizzes.courses.title}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {submission.profiles?.full_name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant={submission.score > 0 ? "default" : "destructive"}
                            className="text-sm"
                          >
                            Score: {submission.score}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Student: {submission.profiles?.email || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/quiz-submissions/${submission.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
