'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Clock, CheckCircle, AlertCircle, Paperclip, ArrowLeft, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { useRouter, useParams } from 'next/navigation'

type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  course: {
    title: string
    id: string
  }
  submission?: {
    id: string
    submitted_at: string
    grade?: number
  }
}

export default function AssignmentDetailPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment()
    }
  }, [assignmentId])

  const fetchAssignment = async () => {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses(title, id),
          assignment_submissions!left(id, submitted_at, grade)
        `)
        .eq('id', assignmentId)
        .single()

      if (error) {
        console.error('Error fetching assignment:', error)
        return
      }

      const assignmentWithSubmission = {
        ...data,
        submission: data.assignment_submissions?.[0]
      }

      setAssignment(assignmentWithSubmission)
    } catch (error) {
      console.error('Error fetching assignment:', error)
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment not found</h3>
          <p className="text-gray-500 mb-4">The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const status = getAssignmentStatus(assignment)
  const StatusIcon = status.icon

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-lg text-gray-600 mb-2">Course: {assignment.course.title}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
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
          </div>
          <Badge className={status.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Assignment Content */}
      <div className="space-y-6">
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">
              {assignment.description || 'No description provided.'}
            </p>
          </CardContent>
        </Card>

        {/* Attachments - Currently not supported in assignments table */}

        {/* Submission Status */}
        {assignment.submission && (
          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Assignment Submitted</p>
                    <p className="text-sm text-green-600">
                      Submitted on: {new Date(assignment.submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  {assignment.submission.grade !== null && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-800">
                        {assignment.submission.grade}/{assignment.points || 100}
                      </p>
                      <p className="text-sm text-green-600">Grade</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
          {!assignment.submission && (
            <Button variant="outline">
              Submit Work
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}


