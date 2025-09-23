'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Send,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface QuizQuestion {
  id: string
  question: string
  options?: string[] | null
  correct_answer?: string | null
  order_index: number
}

interface Quiz {
  id: string
  title: string
  description?: string | null
  course_id: string
  created_at: string
  quiz_questions?: QuizQuestion[]
  courses?: {
    id: string
    title: string
  }
}

interface QuizSubmission {
  question_id: string
  answer: string
}

export default function TakeQuizPage() {
  const { profile } = useAuth()
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timeUp, setTimeUp] = useState(false)

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log('Fetching quiz with ID:', quizId)
        const response = await fetch(`/api/quizzes/${quizId}`)
        console.log('Quiz fetch response:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Quiz fetch error:', errorData)
          throw new Error(`Failed to fetch quiz: ${errorData.error || response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Quiz data received:', data)
        setQuiz(data.quiz)
        
        // Set a default time limit (30 minutes) - you can make this configurable
        setTimeRemaining(30 * 60) // 30 minutes in seconds
      } catch (error) {
        console.error('Error fetching quiz:', error)
        toast.error('Failed to load quiz')
        router.push('/courses')
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      fetchQuiz()
    }
  }, [quizId, router])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !timeUp) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimeUp(true)
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeRemaining, timeUp])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = async () => {
    if (!quiz || !profile) return

    setSubmitting(true)
    try {
      const submission = {
        quiz_id: quizId,
        student_id: profile.id,
        answers: Object.entries(answers).map(([question_id, answer]) => ({
          question_id,
          answer
        }))
      }

      const response = await fetch('/api/quiz-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission)
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Quiz submission error:', result)
        throw new Error(`Failed to submit quiz: ${result.error || 'Unknown error'}`)
      }

      // Check if this was already submitted
      if (result.already_submitted) {
        toast.info('You have already submitted this quiz')
      } else {
        toast.success('Quiz submitted successfully!')
      }
      
      // Redirect to results page
      router.push(`/quiz/${quizId}/results/${result.submission_id}`)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getTotalQuestions = () => {
    return quiz?.quiz_questions?.length || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  if (timeUp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Time's Up!</h2>
          <p className="text-gray-600 mb-4">Your quiz has been automatically submitted.</p>
          <Button onClick={() => router.push('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-gray-600">{quiz.courses?.title}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {getAnsweredCount()} of {getTotalQuestions()} answered
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          </div>
          
          {quiz.description && (
            <p className="mt-2 text-gray-700">{quiz.description}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center text-sm mb-2">
            <span>Progress: {getAnsweredCount()} of {getTotalQuestions()} answered</span>
            <span className="text-gray-500">
              {getTotalQuestions() - getAnsweredCount()} remaining
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getAnsweredCount() / getTotalQuestions()) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div className="space-y-6">
          {quiz.quiz_questions
            ?.sort((a, b) => a.order_index - b.order_index)
            .map((question, index) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-lg">Q{index + 1}</span>
                    <span className="text-base font-normal">{question.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {question.options && question.options.length > 0 ? (
                    // Multiple Choice Question
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            answers[question.id] === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="text-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-500">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="flex-1">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    // Short Answer Question
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Enter your answer here..."
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        rows={4}
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          
          <div className="flex items-center gap-4">
            {getAnsweredCount() < getTotalQuestions() && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                {getTotalQuestions() - getAnsweredCount()} questions unanswered
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting || getAnsweredCount() === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
