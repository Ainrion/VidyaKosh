'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

import { Users, Clock, Award, FileText, Download, Eye } from 'lucide-react'
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

interface ExamSession {
  id: string
  student_id: string
  started_at: string
  submitted_at: string | null
  auto_submitted: boolean
  score: number | null
  total_points: number | null
  status: 'in_progress' | 'submitted' | 'graded'
  answers: Record<string, string>
  profiles: {
    full_name: string
    email: string
  }
}

interface ExamQuestion {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  options: string[] | null
  correct_answer: string | null
  points: number
  order_index: number
}

export default function ExamResultsPage() {
  const params = useParams()

  const [exam, setExam] = useState<Exam | null>(null)
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null)
  const [loading, setLoading] = useState(true)

  const [manualGrades, setManualGrades] = useState<Record<string, number>>({})

  const supabase = createClient()
  const examId = params.id as string

  const loadExamResults = useCallback(async () => {
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

      // Fetch exam sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false })

      if (sessionsError) throw sessionsError
      setSessions(sessionsData)

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index')

      if (questionsError) throw questionsError
      setQuestions(questionsData)

    } catch (error) {
      console.error('Error loading exam results:', error)
      toast.error('Failed to load exam results')
    } finally {
      setLoading(false)
    }
  }, [examId, supabase])

  useEffect(() => {
    if (examId) {
      loadExamResults()
    }
  }, [examId, loadExamResults])

  const updateManualGrade = async (sessionId: string, questionId: string, points: number) => {
    try {
      const session = sessions.find(s => s.id === sessionId)
      if (!session) return

      // Get current answers and add grade
      const updatedAnswers = {
        ...session.answers,
        [`${questionId}_grade`]: points.toString()
      }

      // Calculate total score
      let totalScore = 0
      questions.forEach(question => {
        if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
          // Auto-graded questions
          if (session.answers[question.id] === question.correct_answer) {
            totalScore += question.points
          }
        } else {
          // Manually graded questions
          const grade = updatedAnswers[`${question.id}_grade`]
          if (grade) {
            totalScore += parseInt(grade)
          }
        }
      })

      // Update the session
      const { error } = await supabase
        .from('exam_sessions')
        .update({
          answers: updatedAnswers,
          score: totalScore,
          status: 'graded'
        })
        .eq('id', sessionId)

      if (error) throw error

      toast.success('Grade updated successfully')
      loadExamResults()
    } catch (error) {
      console.error('Error updating grade:', error)
      toast.error('Failed to update grade')
    }
  }

  const downloadResults = () => {
    // Create CSV content
    const headers = ['Student Name', 'Email', 'Started At', 'Submitted At', 'Status', 'Score', 'Total Points', 'Percentage']
    const rows = sessions.map(session => [
      session.profiles.full_name,
      session.profiles.email,
      new Date(session.started_at).toLocaleString(),
      session.submitted_at ? new Date(session.submitted_at).toLocaleString() : 'Not submitted',
      session.status,
      session.score || 0,
      session.total_points || 0,
      session.total_points ? Math.round((session.score || 0) / session.total_points * 100) : 0
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exam?.title || 'exam'}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="p-6">Loading exam results...</div>
  }

  if (!exam) {
    return <div className="p-6">Exam not found</div>
  }

  const completedSessions = sessions.filter(s => s.status !== 'in_progress')
  const averageScore = completedSessions.length > 0 
    ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length 
    : 0
  const averageTotal = completedSessions.length > 0 
    ? completedSessions.reduce((sum, s) => sum + (s.total_points || 0), 0) / completedSessions.length 
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{exam.title} - Results</h1>
          <p className="text-gray-600">{exam.courses.title}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadResults} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Link href="/exams">
            <Button variant="outline">Back to Exams</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{completedSessions.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">
                {averageTotal > 0 ? Math.round(averageScore / averageTotal * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{exam.duration_minutes}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="grading">Manual Grading</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Student Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Started</th>
                    <th className="text-left p-2">Submitted</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Percentage</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const percentage = session.total_points 
                      ? Math.round((session.score || 0) / session.total_points * 100)
                      : 0
                    
                    return (
                      <tr key={session.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{session.profiles.full_name}</div>
                            <div className="text-sm text-gray-500">{session.profiles.email}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={
                            session.status === 'graded' ? 'default' :
                            session.status === 'submitted' ? 'secondary' : 'outline'
                          }>
                            {session.status}
                          </Badge>
                          {session.auto_submitted && (
                            <Badge variant="destructive" className="ml-1">Auto</Badge>
                          )}
                        </td>
                        <td className="p-2">
                          {new Date(session.started_at).toLocaleString()}
                        </td>
                        <td className="p-2">
                          {session.submitted_at 
                            ? new Date(session.submitted_at).toLocaleString()
                            : 'In Progress'
                          }
                        </td>
                        <td className="p-2">
                          {session.score !== null ? `${session.score}/${session.total_points}` : '-'}
                        </td>
                        <td className="p-2">
                          <span className={
                            percentage >= 80 ? 'text-green-600' :
                            percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }>
                            {percentage}%
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            onClick={() => setSelectedSession(session)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {selectedSession && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedSession.profiles.full_name}&apos;s Answers
              </h3>
              
              <div className="space-y-6">
                {questions.map((question, index) => {
                  const studentAnswer = selectedSession.answers[question.id]
                  const isCorrect = question.correct_answer && studentAnswer === question.correct_answer
                  const manualGrade = selectedSession.answers[`${question.id}_grade`]
                  
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <p className="text-gray-700 mt-1">{question.question_text}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {question.points} point{question.points !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      {/* Show options for multiple choice */}
                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">Options:</div>
                          <ul className="list-disc list-inside text-sm">
                            {question.options.map((option, i) => (
                              <li key={i} className={
                                option === question.correct_answer ? 'text-green-600 font-medium' :
                                option === studentAnswer ? 'text-red-600' : ''
                              }>
                                {option}
                                {option === question.correct_answer && ' ✓'}
                                {option === studentAnswer && option !== question.correct_answer && ' ✗'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Student Answer: </span>
                          <span className={
                            question.question_type === 'multiple_choice' || question.question_type === 'true_false'
                              ? isCorrect ? 'text-green-600' : 'text-red-600'
                              : ''
                          }>
                            {studentAnswer || 'No answer'}
                          </span>
                        </div>
                        
                        {question.correct_answer && (
                          <div>
                            <span className="text-sm font-medium">Correct Answer: </span>
                            <span className="text-green-600">{question.correct_answer}</span>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-sm font-medium">Points Earned: </span>
                          <span>
                            {question.question_type === 'multiple_choice' || question.question_type === 'true_false'
                              ? isCorrect ? question.points : 0
                              : manualGrade || 'Not graded'
                            } / {question.points}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="grading" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Manual Grading</h3>
            <p className="text-gray-600 mb-4">
              Grade short answer and essay questions for students who need manual review.
            </p>
            
            {sessions.filter(s => s.status === 'submitted').map((session) => {
              const needsGrading = questions.some(q => 
                (q.question_type === 'short_answer' || q.question_type === 'essay') &&
                session.answers[q.id] && !session.answers[`${q.id}_grade`]
              )
              
              if (!needsGrading) return null
              
              return (
                <div key={session.id} className="border rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-3">{session.profiles.full_name}</h4>
                  
                  {questions.filter(q => q.question_type === 'short_answer' || q.question_type === 'essay').map((question) => {
                    const answer = session.answers[question.id]
                    const currentGrade = session.answers[`${question.id}_grade`]
                    
                    if (!answer) return null
                    
                    return (
                      <div key={question.id} className="mb-4 p-3 bg-gray-50 rounded">
                        <div className="mb-2">
                          <span className="font-medium">Question: </span>
                          {question.question_text}
                        </div>
                        <div className="mb-2">
                          <span className="font-medium">Answer: </span>
                          <div className="mt-1 p-2 bg-white rounded border">
                            {answer}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Points:</span>
                          <Input
                            type="number"
                            min="0"
                            max={question.points}
                            value={manualGrades[`${session.id}_${question.id}`] ?? currentGrade ?? ''}
                            onChange={(e) => setManualGrades({
                              ...manualGrades,
                              [`${session.id}_${question.id}`]: parseInt(e.target.value) || 0
                            })}
                            className="w-20"
                          />
                          <span className="text-sm">/ {question.points}</span>
                          <Button
                            onClick={() => {
                              const grade = manualGrades[`${session.id}_${question.id}`] ?? 0
                              updateManualGrade(session.id, question.id, grade)
                            }}
                            size="sm"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
