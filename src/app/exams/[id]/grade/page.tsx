'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
// DashboardLayout is now handled globally in AppLayout
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  Clock, 
  User, 
  File, 
  Download,
  Eye,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Exam {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  courses: {
    title: string
  }
}

interface ExamQuestion {
  id: string
  question_text: string
  question_type: string
  points: number
  order_index: number
}

interface ExamSession {
  id: string
  student_id: string
  started_at: string
  submitted_at: string
  status: string
  total_grade: number | null
  grading_status: string
  profiles: {
    full_name: string
    email: string
  }
}

interface ExamAnswer {
  id: string
  question_id: string
  text_answer: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  submitted_at: string
  exam_questions: ExamQuestion
  exam_grades?: {
    id: string
    points_awarded: number
    feedback: string | null
    graded_at: string
  }
}

export default function GradeExamPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null)
  const [answers, setAnswers] = useState<ExamAnswer[]>([])
  const [grades, setGrades] = useState<Record<string, { points: number; feedback: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const examId = params.id as string

  const loadExamData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          courses (title)
        `)
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExam(examData)

      // Fetch exam sessions with student info
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .eq('exam_id', examId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])

    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam data')
      router.push('/exams')
    } finally {
      setLoading(false)
    }
  }, [examId, supabase, router])

  const loadSessionAnswers = useCallback(async (sessionId: string) => {
    try {
      const { data: answersData, error: answersError } = await supabase
        .from('exam_answers')
        .select(`
          *,
          exam_questions (*),
          exam_grades (*)
        `)
        .eq('exam_session_id', sessionId)
        .order('exam_questions.order_index')

      if (answersError) throw answersError

      setAnswers(answersData || [])

      // Initialize grades from existing data
      const initialGrades: Record<string, { points: number; feedback: string }> = {}
      answersData?.forEach(answer => {
        if (answer.exam_grades) {
          initialGrades[answer.question_id] = {
            points: answer.exam_grades.points_awarded,
            feedback: answer.exam_grades.feedback || ''
          }
        } else {
          initialGrades[answer.question_id] = {
            points: 0,
            feedback: ''
          }
        }
      })
      setGrades(initialGrades)

    } catch (error) {
      console.error('Error loading answers:', error)
      toast.error('Failed to load student answers')
    }
  }, [supabase])

  useEffect(() => {
    if (examId && profile) {
      loadExamData()
    }
  }, [examId, profile, loadExamData])

  const handleSessionSelect = (session: ExamSession) => {
    setSelectedSession(session)
    loadSessionAnswers(session.id)
  }

  const updateGrade = (questionId: string, field: 'points' | 'feedback', value: string | number) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }))
  }

  const saveGrades = async () => {
    if (!selectedSession) return

    try {
      setSaving(true)

      // Save grades for each question
      for (const [questionId, grade] of Object.entries(grades)) {
        const answer = answers.find(a => a.question_id === questionId)
        if (!answer) continue

        const gradeData = {
          exam_session_id: selectedSession.id,
          question_id: questionId,
          points_awarded: grade.points,
          feedback: grade.feedback || null,
          graded_by: profile?.id
        }

        if (answer.exam_grades) {
          // Update existing grade
          await supabase
            .from('exam_grades')
            .update(gradeData)
            .eq('id', answer.exam_grades.id)
        } else {
          // Create new grade
          await supabase
            .from('exam_grades')
            .insert(gradeData)
        }
      }

      // Update session grading status
      await supabase
        .from('exam_sessions')
        .update({ grading_status: 'completed' })
        .eq('id', selectedSession.id)

      toast.success('Grades saved successfully')
      
      // Reload data
      loadExamData()
      loadSessionAnswers(selectedSession.id)

    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('exam-files')
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>    )
  }

  if (!exam) {
    return (
      <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Not Found</h1>
            <p className="text-gray-600 mb-4">The exam you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/exams')}>
              Back to Exams
            </Button>
          </div>
        </div>    )
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/exams')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grade Exam</h1>
            <p className="text-gray-600 mt-1">{exam.title} - {exam.courses.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Student Submissions</h2>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{session.profiles.full_name}</p>
                        <p className="text-sm text-gray-500">{session.profiles.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={session.grading_status === 'completed' ? 'default' : 'secondary'}
                        >
                          {session.grading_status === 'completed' ? 'Graded' : 'Pending'}
                        </Badge>
                        {session.total_grade !== null && (
                          <p className="text-sm text-gray-500 mt-1">
                            {session.total_grade} points
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Grading Interface */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="space-y-6">
                {/* Student Info */}
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {selectedSession.profiles.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedSession.profiles.full_name}</h3>
                        <p className="text-sm text-gray-500">{selectedSession.profiles.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(selectedSession.submitted_at).toLocaleString()}
                      </p>
                      <Badge 
                        variant={selectedSession.grading_status === 'completed' ? 'default' : 'secondary'}
                      >
                        {selectedSession.grading_status === 'completed' ? 'Graded' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Answers */}
                <div className="space-y-4">
                  {answers.map((answer, index) => (
                    <Card key={answer.id} className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">Question {index + 1}</h4>
                            <p className="text-gray-700 mt-1">{answer.exam_questions.question_text}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {answer.exam_questions.points} point{answer.exam_questions.points !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Answer Content */}
                        <div className="space-y-3">
                          {answer.text_answer && (
                            <div>
                              <Label className="text-sm font-medium">Text Answer:</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                <p className="whitespace-pre-wrap">{answer.text_answer}</p>
                              </div>
                            </div>
                          )}

                          {answer.file_path && (
                            <div>
                              <Label className="text-sm font-medium">Uploaded File:</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <File className="h-4 w-4" />
                                    <span className="font-medium">{answer.file_name}</span>
                                    <span className="text-sm text-gray-500">
                                      ({formatFileSize(answer.file_size || 0)})
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(getFileUrl(answer.file_path!), '_blank')}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a')
                                        link.href = getFileUrl(answer.file_path!)
                                        link.download = answer.file_name || 'download'
                                        link.click()
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Grading */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <Label htmlFor={`points-${answer.question_id}`}>
                              Points Awarded (max {answer.exam_questions.points})
                            </Label>
                            <Input
                              id={`points-${answer.question_id}`}
                              type="number"
                              min="0"
                              max={answer.exam_questions.points}
                              value={grades[answer.question_id]?.points || 0}
                              onChange={(e) => updateGrade(answer.question_id, 'points', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`feedback-${answer.question_id}`}>Feedback</Label>
                            <Textarea
                              id={`feedback-${answer.question_id}`}
                              value={grades[answer.question_id]?.feedback || ''}
                              onChange={(e) => updateGrade(answer.question_id, 'feedback', e.target.value)}
                              placeholder="Add feedback for the student..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={saveGrades} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Grades
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Student</h3>
                <p className="text-gray-500">Choose a student submission from the list to start grading.</p>
              </Card>
            )}
          </div>
        </div>
      </div>  )
}
