'use client'

// DashboardLayout is now handled globally in AppLayout
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  course: {
    title: string
  }
  submission?: {
    id: string
    submitted_at: string
    grade?: number
  }
}

export default function AssignmentsPage() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
  }, [profile?.id])

  const fetchAssignments = async () => {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    try {
      // First get enrolled course IDs
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', profile.id)

      if (enrollmentError) {
        console.error('Error fetching enrollments:', enrollmentError)
        // If it's an RLS error, set empty assignments but don't throw
        if (enrollmentError.message?.includes('406') || enrollmentError.code === '42501') {
          console.log('RLS blocking enrollments access, showing empty state')
          setAssignments([])
          return
        }
        throw enrollmentError
      }

      const courseIds = enrollments?.map(e => e.course_id) || []

      if (courseIds.length === 0) {
        setAssignments([])
        return
      }

      // Get assignments from enrolled courses
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses(title),
          assignment_submissions!left(id, submitted_at, grade)
        `)
        .in('course_id', courseIds)
        .order('due_date', { ascending: true })

      if (error) {
        console.error('Error fetching assignments:', error)
        // If it's an RLS error, set empty assignments
        if (error.message?.includes('406') || error.code === '42501') {
          console.log('RLS blocking assignments access, showing empty state')
          setAssignments([])
          return
        }
        throw error
      }

      const assignmentsWithSubmissions = data?.map(assignment => ({
        ...assignment,
        submission: assignment.assignment_submissions?.[0]
      })) || []

      setAssignments(assignmentsWithSubmissions)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.submission) {
      if (assignment.submission.grade !== null) {
        return {
          status: 'graded',
          label: `Graded: ${assignment.submission.grade}/${assignment.points || 100}`,
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        }
      }
      return {
        status: 'submitted',
        label: 'Submitted',
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle
      }
    }

    if (assignment.due_date) {
      const dueDate = new Date(assignment.due_date)
      const now = new Date()
      
      if (dueDate < now) {
        return {
          status: 'overdue',
          label: 'Overdue',
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle
        }
      }
      
      const timeDiff = dueDate.getTime() - now.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff <= 1) {
        return {
          status: 'due-soon',
          label: 'Due Soon',
          color: 'bg-orange-100 text-orange-800',
          icon: Clock
        }
      }
    }

    return {
      status: 'pending',
      label: 'Pending',
      color: 'bg-gray-100 text-gray-800',
      icon: FileText
    }
  }

  if (loading) {
    return (
      <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>    )
  }

  return (
    <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">View and submit your course assignments</p>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-500 text-center">
                You don't have any assignments yet. Check back later or contact your teachers.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const status = getAssignmentStatus(assignment)
              const StatusIcon = status.icon
              
              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {assignment.course?.title}
                        </CardDescription>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {assignment.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      {assignment.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {assignment.points && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{assignment.points} points</span>
                        </div>
                      )}
                    </div>

                    {assignment.submission && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Submitted: {new Date(assignment.submission.submitted_at).toLocaleDateString()}
                          </span>
                          {assignment.submission.grade !== null && (
                            <span className="font-medium">
                              Grade: {assignment.submission.grade}/{assignment.points || 100}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        View Assignment
                      </Button>
                      {!assignment.submission && (
                        <Button size="sm" variant="outline">
                          Submit Work
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>  )
}
