'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Trophy,
  Clock,
  FileText,
  Target
} from 'lucide-react'

interface QuizAnswer {
  id: string
  question_id: string
  student_answer: string
  correct_answer: string | null
  is_correct: boolean
  quiz_questions: {
    id: string
    question: string
    options: string[] | null
  }
}

interface QuizSubmission {
  id: string
  score: number
  submitted_at: string
  quizzes: {
    id: string
    title: string
    description: string | null
    courses: {
      id: string
      title: string
    }
  }
  quiz_answers: QuizAnswer[]
}

export default function QuizResultsPage() {
  const { profile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<QuizSubmission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/quiz-submissions/${submissionId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch submission')
        }
        const data = await response.json()
        setSubmission(data.submission)
      } catch (error) {
        console.error('Error fetching submission:', error)
        router.push('/courses')
      } finally {
        setLoading(false)
      }
    }

    if (submissionId) {
      fetchSubmission()
    }
  }, [submissionId, router])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' as const
    if (score >= 60) return 'secondary' as const
    return 'destructive' as const
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-4">The quiz results you're looking for don't exist.</p>
          <Button onClick={() => router.push('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  const correctAnswers = submission.quiz_answers.filter(answer => answer.is_correct).length
  const totalQuestions = submission.quiz_answers.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Quiz Results</h1>
              <p className="text-gray-600 mt-1">{submission.quizzes.title}</p>
              <p className="text-sm text-gray-500">{submission.quizzes.courses.title}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Score Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(submission.score)}`}>
                  {submission.score}%
                </div>
                <p className="text-sm text-gray-600">Overall Score</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {correctAnswers}/{totalQuestions}
                </div>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-600">
                  {totalQuestions - correctAnswers}
                </div>
                <p className="text-sm text-gray-600">Incorrect Answers</p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center">
              <Badge 
                variant={getScoreBadgeVariant(submission.score)}
                className="text-lg px-4 py-2"
              >
                {submission.score >= 80 ? 'Excellent!' : 
                 submission.score >= 60 ? 'Good Job!' : 
                 'Keep Practicing!'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Submission Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              Submission Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Submitted On</p>
                <p className="font-medium">{formatDate(submission.submitted_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quiz</p>
                <p className="font-medium">{submission.quizzes.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              Question Review
            </CardTitle>
            <CardDescription>
              Review your answers and see the correct solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {submission.quiz_answers
                .sort((a, b) => {
                  // Sort by question order if available, otherwise by question_id
                  return a.question_id.localeCompare(b.question_id)
                })
                .map((answer, index) => (
                  <div key={answer.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-lg">Question {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        {answer.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          answer.is_correct ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {answer.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{answer.quiz_questions.question}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                        <div className={`p-3 rounded-lg ${
                          answer.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <p className={answer.is_correct ? 'text-green-800' : 'text-red-800'}>
                            {answer.student_answer || 'No answer provided'}
                          </p>
                        </div>
                      </div>
                      
                      {!answer.is_correct && answer.correct_answer && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                            <p className="text-green-800">{answer.correct_answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
