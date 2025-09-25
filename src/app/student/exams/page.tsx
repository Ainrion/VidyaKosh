'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
// DashboardLayout is now handled globally in AppLayout
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, Calendar, AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react'
import Link from 'next/link'

interface AvailableExam {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  start_time: string | null
  end_time: string | null
  courses: {
    title: string
  }
  exam_sessions?: {
    id: string
    status: string
  }[]
}

export default function StudentExamsPage() {
  const { profile } = useAuth()
  const [availableExams, setAvailableExams] = useState<AvailableExam[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchAvailableExams = useCallback(async () => {
    try {
      setLoading(true)
      
      // First check if the user has permission and school_id
      if (!profile || !profile.school_id) {
        console.log('No profile or school_id found, skipping exam fetch')
        setAvailableExams([])
        return
      }
      
      console.log('Fetching exams for student:', profile.id, 'school:', profile.school_id)
      
      // Get exams from courses the student is enrolled in WITH school_id filtering
      const { data: enrolledCourses, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses!inner (id, school_id, title)
        `)
        .eq('student_id', profile?.id)
        .eq('courses.school_id', profile.school_id) // Ensure student and courses are in same school

      if (enrollmentError) throw enrollmentError

      console.log('Enrolled courses:', enrolledCourses)
      const courseIds = enrolledCourses.map(e => e.course_id)

      if (courseIds.length === 0) {
        console.log('No enrolled courses found for student')
        setAvailableExams([])
        return
      }

      console.log('Course IDs for exam fetch:', courseIds)

      // Fetch exams from enrolled courses with school_id filtering
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          courses (title, school_id),
          exam_sessions!left (id, status, student_id)
        `)
        .in('course_id', courseIds)
        .eq('is_published', true)
        .eq('school_id', profile.school_id) // Ensure exams belong to student's school
        .order('created_at', { ascending: false })

      if (examsError) throw examsError
      
      console.log('Fetched exams:', examsData)
      
      // Filter exam sessions for this student
      const filteredExams = examsData?.map(exam => ({
        ...exam,
        exam_sessions: exam.exam_sessions?.filter((session: any) => session.student_id === profile.id) || []
      })) || []
      
      console.log('Filtered exams with sessions:', filteredExams)
      setAvailableExams(filteredExams)
    } catch (error) {
      console.error('Error fetching available exams:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.school_id, supabase])

  useEffect(() => {
    if (profile) {
      fetchAvailableExams()
    }
  }, [profile, fetchAvailableExams])

  const getExamStatus = (exam: AvailableExam) => {
    const now = new Date()
    const session = exam.exam_sessions?.[0]

    // Check if student has already completed the exam
    if (session) {
      if (session.status === 'in_progress') {
        return { status: 'in_progress', label: 'Resume Exam', color: 'blue', canTake: true }
      } else {
        return { status: 'completed', label: 'Completed', color: 'green', canTake: false }
      }
    }

    // Check time window
    if (exam.start_time && new Date(exam.start_time) > now) {
      return { status: 'upcoming', label: 'Upcoming', color: 'gray', canTake: false }
    }
    
    if (exam.end_time && new Date(exam.end_time) < now) {
      return { status: 'expired', label: 'Expired', color: 'red', canTake: false }
    }

    return { status: 'available', label: 'Available', color: 'green', canTake: true }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Available Exams</h1>
          <p className="text-gray-600">Take exams for your enrolled courses</p>
        </div>
        <Link href="/exams/completed">
          <Button variant="outline">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            View Completed Exams
          </Button>
        </Link>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {availableExams.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
            <p className="text-gray-500 mb-4">
              There are no published exams for your enrolled courses at the moment.
            </p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </Card>
        ) : (
          availableExams.map((exam) => {
            const examStatus = getExamStatus(exam)
            
            return (
              <Card key={exam.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{exam.title}</h3>
                      <Badge variant={
                        examStatus.color === 'green' ? 'default' :
                        examStatus.color === 'blue' ? 'default' :
                        examStatus.color === 'red' ? 'destructive' : 'secondary'
                      }>
                        {examStatus.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{exam.courses.title}</p>
                    
                    {exam.description && (
                      <p className="text-sm text-gray-500 mb-3">{exam.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{exam.duration_minutes} minutes</span>
                      </div>
                      
                      {exam.start_time && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Starts: {formatDateTime(exam.start_time)}
                          </span>
                        </div>
                      )}
                      
                      {exam.end_time && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Ends: {formatDateTime(exam.end_time)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status-specific messages */}
                    {examStatus.status === 'upcoming' && exam.start_time && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          This exam will be available on {formatDateTime(exam.start_time)}
                        </span>
                      </div>
                    )}
                    
                    {examStatus.status === 'expired' && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">
                          This exam has expired and is no longer available
                        </span>
                      </div>
                    )}
                    
                    {examStatus.status === 'completed' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          You have already completed this exam
                        </span>
                      </div>
                    )}
                    
                    {examStatus.status === 'in_progress' && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          You have an exam in progress. Click &quot;Resume Exam&quot; to continue.
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <div className="ml-4">
                    {examStatus.canTake ? (
                      <Link href={`/exams/${exam.id}/take`}>
                        <Button>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {examStatus.status === 'in_progress' ? 'Resume Exam' : 'Start Exam'}
                        </Button>
                      </Link>
                    ) : examStatus.status === 'completed' ? (
                      <Link href="/exams/completed">
                        <Button variant="outline">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled variant="outline">
                        {examStatus.label}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>  )
}
