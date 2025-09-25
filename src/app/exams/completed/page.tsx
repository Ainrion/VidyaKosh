'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Award, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

interface CompletedExam {
  id: string
  exam_id: string
  started_at: string
  submitted_at: string | null
  auto_submitted: boolean
  score: number | null
  total_points: number | null
  status: 'in_progress' | 'submitted' | 'graded'
  exams: {
    title: string
    description: string | null
    duration_minutes: number
    courses: {
      title: string
    }
  }
}

export default function CompletedExamsPage() {
  const { profile } = useAuth()
  const [completedExams, setCompletedExams] = useState<CompletedExam[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchCompletedExams = useCallback(async () => {
    try {
      setLoading(true)
      
      // First check if the user has permission and school_id
      if (!profile || !profile.school_id) {
        console.log('No profile or school_id found, skipping completed exams fetch')
        setCompletedExams([])
        return
      }
      
      const { data, error } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          exams (
            title,
            description,
            duration_minutes,
            school_id,
            courses (title, school_id)
          )
        `)
        .eq('student_id', profile?.id)
        .eq('exams.school_id', profile.school_id) // Ensure exams belong to student's school
        .neq('status', 'in_progress')
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setCompletedExams(data || [])
    } catch (error) {
      console.error('Error fetching completed exams:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.school_id, supabase])

  useEffect(() => {
    if (profile) {
      fetchCompletedExams()
    }
  }, [profile, fetchCompletedExams])

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
      </div>
    )
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeLetter = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 90) return 'A+'
    if (percentage >= 85) return 'A'
    if (percentage >= 80) return 'A-'
    if (percentage >= 75) return 'B+'
    if (percentage >= 70) return 'B'
    if (percentage >= 65) return 'B-'
    if (percentage >= 60) return 'C+'
    if (percentage >= 55) return 'C'
    if (percentage >= 50) return 'C-'
    return 'F'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Completed Exams</h1>
          <p className="text-gray-600">View your exam results and performance</p>
        </div>
      </div>

      {/* Summary Stats */}
      {completedExams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{completedExams.length}</div>
                <div className="text-sm text-gray-600">Total Exams</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {completedExams.filter(e => e.status === 'graded').length}
                </div>
                <div className="text-sm text-gray-600">Graded</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {completedExams.filter(e => e.score && e.total_points && (e.score / e.total_points) >= 0.8).length}
                </div>
                <div className="text-sm text-gray-600">High Scores (80%+)</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(completedExams.reduce((sum, e) => {
                    if (e.submitted_at) {
                      const duration = new Date(e.submitted_at).getTime() - new Date(e.started_at).getTime()
                      return sum + (duration / (1000 * 60)) // Convert to minutes
                    }
                    return sum
                  }, 0) / completedExams.filter(e => e.submitted_at).length) || 0}
                </div>
                <div className="text-sm text-gray-600">Avg. Time (min)</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Exams List */}
      <div className="space-y-4">
        {completedExams.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed exams</h3>
            <p className="text-gray-500 mb-4">You haven&apos;t completed any exams yet.</p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </Card>
        ) : (
          completedExams.map((examSession) => {
            const exam = examSession.exams
            const percentage = examSession.total_points && examSession.score 
              ? Math.round((examSession.score / examSession.total_points) * 100)
              : null
            
            const duration = examSession.submitted_at 
              ? Math.round((new Date(examSession.submitted_at).getTime() - new Date(examSession.started_at).getTime()) / (1000 * 60))
              : null

            return (
              <Card key={examSession.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{exam.title}</h3>
                      <Badge variant={
                        examSession.status === 'graded' ? 'default' :
                        examSession.status === 'submitted' ? 'secondary' : 'outline'
                      }>
                        {examSession.status}
                      </Badge>
                      {examSession.auto_submitted && (
                        <Badge variant="destructive">Auto-submitted</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{exam.courses.title}</p>
                    
                    {exam.description && (
                      <p className="text-sm text-gray-500 mb-3">{exam.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(examSession.started_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {duration ? `${duration} min` : `${exam.duration_minutes} min limit`}
                        </span>
                      </div>
                      
                      {examSession.submitted_at && (
                        <div className="text-gray-600">
                          Submitted: {new Date(examSession.submitted_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Score Display */}
                  <div className="text-right">
                    {examSession.status === 'graded' && examSession.score !== null && examSession.total_points ? (
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          <span className={getScoreColor(examSession.score, examSession.total_points)}>
                            {getGradeLetter(examSession.score, examSession.total_points)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {examSession.score}/{examSession.total_points} ({percentage}%)
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (percentage || 0) >= 80 ? 'bg-green-500' :
                              (percentage || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    ) : examSession.status === 'submitted' ? (
                      <div className="text-center">
                        <div className="text-yellow-600 font-medium">Pending</div>
                        <div className="text-sm text-gray-500">Awaiting grades</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-500 font-medium">In Progress</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Performance Insights */}
                {examSession.status === 'graded' && percentage !== null && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">Performance: </span>
                      {percentage >= 90 ? (
                        <span className="text-green-600">Excellent work! Outstanding performance.</span>
                      ) : percentage >= 80 ? (
                        <span className="text-green-600">Great job! Very good performance.</span>
                      ) : percentage >= 70 ? (
                        <span className="text-yellow-600">Good work! Room for improvement.</span>
                      ) : percentage >= 60 ? (
                        <span className="text-yellow-600">Fair performance. Consider reviewing the material.</span>
                      ) : (
                        <span className="text-red-600">Needs improvement. Please review the material and ask for help.</span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
