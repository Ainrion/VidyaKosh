'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { Textarea } from '@/components/ui/textarea'
import { ExamTimer } from '@/components/exam-timer'
import { FileUpload } from '@/components/ui/file-upload'
import { AlertTriangle, CheckCircle2, Upload, File, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Exam {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  start_time: string | null
  end_time: string | null
  is_published: boolean
  courses: {
    title: string
  }
}

interface ExamQuestion {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'file_upload' | 'subjective'
  options: string[] | null
  points: number
  order_index: number
  file_requirements?: {
    allowed_types: string[]
    max_size_mb: number
    instructions: string
  }
  word_limit?: number
  rich_text_enabled?: boolean
  file_path?: string
  file_name?: string
  file_size?: number
  mime_type?: string
}

interface ExamSession {
  id: string
  started_at: string
  submitted_at: string | null
  answers: Record<string, string>
  status: 'in_progress' | 'submitted' | 'graded'
}

export default function TakeExamPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [session, setSession] = useState<ExamSession | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  const supabase = createClient()
  const examId = params.id as string

  const loadExamData = useCallback(async () => {
    try {
      setLoading(true)

      // First check if the user has permission and school_id
      if (!profile || !profile.school_id) {
        toast.error('Access denied: No school access')
        router.push('/courses')
        return
      }

      // Fetch exam details with school_id filtering
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          courses (title, school_id)
        `)
        .eq('id', examId)
        .eq('is_published', true)
        .eq('school_id', profile.school_id) // Ensure exam belongs to student's school
        .single()

      if (examError) throw examError
      
      // Additional security check: ensure the course also belongs to the same school
      if (examData.courses?.school_id !== profile.school_id) {
        toast.error('Access denied: Exam belongs to a different school')
        router.push('/courses')
        return
      }
      
      setExam(examData)

      // Check if exam is available (time window)
      const now = new Date()
      if (examData.start_time && new Date(examData.start_time) > now) {
        toast.error('Exam has not started yet')
        router.push('/courses')
        return
      }
      if (examData.end_time && new Date(examData.end_time) < now) {
        toast.error('Exam has ended')
        router.push('/courses')
        return
      }

      // Check for existing session
      const { data: sessionData } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', profile?.id)
        .single()

      if (sessionData) {
        if (sessionData.status !== 'in_progress') {
          toast.error('You have already completed this exam')
          router.push('/courses')
          return
        }
        setSession(sessionData)
        setAnswers(sessionData.answers || {})
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('exam_sessions')
          .insert({
            exam_id: examId,
            student_id: profile?.id,
            answers: {}
          })
          .select()
          .single()

        if (createError) throw createError
        setSession(newSession)
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index')

      if (questionsError) throw questionsError
      setQuestions(questionsData)

    } catch (error) {
      console.error('Error loading exam:', error)
      toast.error('Failed to load exam')
      router.push('/courses')
    } finally {
      setLoading(false)
    }
  }, [examId, profile, supabase, router])

  useEffect(() => {
    if (examId && profile) {
      loadExamData()
    }
  }, [examId, profile, loadExamData])

  const updateAnswer = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)

    // Auto-save answers
    saveAnswers(newAnswers)
  }

  const handleFileUpload = async (questionId: string, file: File) => {
    // File upload is now handled by the FileUpload component directly
    // This function is kept for backward compatibility
    console.log('File selected for upload:', file.name)
  }

  const handleFileRemove = async (questionId: string) => {
    if (!session || !uploadedFiles[questionId]) return

    try {
      // Get the file path from the uploaded file data
      const filePath = uploadedFiles[questionId].path || uploadedFiles[questionId].file_path
      
      if (!filePath) {
        throw new Error('File path not found')
      }

      const response = await fetch(`/api/exams/upload-file?filePath=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove file')
      }

      // Update state
      setUploadedFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[questionId]
        return newFiles
      })

      // Clear answer
      updateAnswer(questionId, '')

      toast.success('File removed successfully')
    } catch (error) {
      console.error('Remove error:', error)
      toast.error('Failed to remove file')
    }
  }

  const saveAnswers = async (answersToSave: Record<string, string>) => {
    if (!session) return

    try {
      await supabase
        .from('exam_sessions')
        .update({ answers: answersToSave })
        .eq('id', session.id)
    } catch (error) {
      console.error('Error saving answers:', error)
    }
  }

  const submitExam = async (autoSubmit = false) => {
    if (!session || submitting) return

    try {
      setSubmitting(true)

      // Update session as submitted
      const { error: updateError } = await supabase
        .from('exam_sessions')
        .update({
          submitted_at: new Date().toISOString(),
          auto_submitted: autoSubmit,
          status: 'submitted',
          answers: answers
        })
        .eq('id', session.id)

      if (updateError) throw updateError

      // Calculate score using the database function
      const { error: scoreError } = await supabase.rpc('calculate_exam_score', {
        session_id: session.id
      })

      if (scoreError) {
        console.error('Error calculating score:', scoreError)
        // Continue even if score calculation fails
      }

      toast.success(autoSubmit ? 'Exam auto-submitted due to time limit' : 'Exam submitted successfully')
      router.push('/exams/completed')

    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error('Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTimeUp = () => {
    submitExam(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!exam || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Exam Not Available</h2>
          <p className="text-gray-600">This exam is not available or you don&apos;t have permission to take it.</p>
        </div>
      </div>
    )
  }

  const unansweredQuestions = questions.filter(q => {
    const answer = answers[q.id]
    if (!answer?.trim()) return true
    
    // For file upload questions, check if file is actually uploaded
    if (q.question_type === 'file_upload') {
      return !uploadedFiles[q.id]
    }
    
    return false
  }).length
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Timer */}
      <ExamTimer
        durationMinutes={exam.duration_minutes}
        startTime={session.started_at}
        onTimeUp={handleTimeUp}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{exam.title}</h1>
              <p className="text-gray-600">{exam.courses.title}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Points: {totalPoints}</div>
              <div className="text-sm text-gray-500">Questions: {questions.length}</div>
            </div>
          </div>
          
          {exam.description && (
            <p className="mt-2 text-gray-700">{exam.description}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center text-sm">
            <span>Progress: {questions.length - unansweredQuestions} of {questions.length} answered</span>
            <span className="text-gray-500">
              {unansweredQuestions > 0 && `${unansweredQuestions} unanswered`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((questions.length - unansweredQuestions) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-semibold">Question {index + 1}</span>
                  <span className="text-sm text-gray-500">({question.points} point{question.points !== 1 ? 's' : ''})</span>
                  {(answers[question.id]?.trim() || (question.question_type === 'file_upload' && uploadedFiles[question.id])) && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                {/* Display question text or file */}
                {question.file_name && question.question_text ? (
                  <div className="mb-4">
                    <p className="text-gray-800 mb-2">Question File:</p>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <a 
                        href={question.question_text} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {question.file_name}
                      </a>
                      <span className="text-sm text-gray-500">
                        ({(question.file_size ? question.file_size / 1024 : 0).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 mb-4">{question.question_text}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Multiple Choice */}
              {question.question_type === 'multiple_choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => updateAnswer(question.id, e.target.value)}
                        className="text-blue-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {question.question_type === 'true_false' && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`question_${question.id}`}
                      value="true"
                      checked={answers[question.id] === 'true'}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      className="text-blue-600"
                    />
                    <span>True</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`question_${question.id}`}
                      value="false"
                      checked={answers[question.id] === 'false'}
                      onChange={(e) => updateAnswer(question.id, e.target.value)}
                      className="text-blue-600"
                    />
                    <span>False</span>
                  </label>
                </div>
              )}

              {/* Short Answer, Essay & Subjective */}
              {(question.question_type === 'short_answer' || question.question_type === 'essay' || question.question_type === 'subjective') && (
                <div className="space-y-2">
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Enter your answer here..."
                    rows={question.question_type === 'essay' || question.question_type === 'subjective' ? 6 : 3}
                    className="w-full"
                  />
                  {question.word_limit && (
                    <div className="text-sm text-gray-500">
                      Word limit: {question.word_limit} words
                      {answers[question.id] && (
                        <span className="ml-2">
                          ({answers[question.id].split(' ').filter(word => word.trim()).length} words used)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* File Upload */}
              {question.question_type === 'file_upload' && (
                <div className="space-y-4">
                  {question.file_requirements?.instructions && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Instructions:</strong> {question.file_requirements.instructions}
                      </p>
                    </div>
                  )}
                  
                  <FileUpload
                    onFileSelect={(file) => handleFileUpload(question.id, file)}
                    onFileRemove={() => handleFileRemove(question.id)}
                    onFileUpload={(fileData) => {
                      // Update uploaded files state with enhanced file data
                      setUploadedFiles(prev => ({
                        ...prev,
                        [question.id]: fileData
                      }))
                      // Update answer to indicate file uploaded
                      updateAnswer(question.id, `FILE_UPLOADED:${fileData.id}`)
                    }}
                    acceptedTypes={question.file_requirements?.allowed_types || ['.pdf', '.doc', '.docx', '.txt', '.xml', '.jpg', '.jpeg', '.png']}
                    maxSizeMB={question.file_requirements?.max_size_mb || 50}
                    uploadEndpoint="/api/exams/upload-file"
                    uploadMetadata={{
                      examSessionId: session?.id || '',
                      questionId: question.id
                    }}
                    existingFile={uploadedFiles[question.id] ? {
                      name: uploadedFiles[question.id].name,
                      size: uploadedFiles[question.id].size,
                      url: uploadedFiles[question.id].url,
                      type: uploadedFiles[question.id].type
                    } : undefined}
                    placeholder="Upload your answer file here..."
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Submit Section */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Ready to Submit?</h3>
              <p className="text-gray-600">
                {unansweredQuestions > 0 ? (
                  <span className="text-orange-600">
                    You have {unansweredQuestions} unanswered question{unansweredQuestions !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-green-600">All questions answered!</span>
                )}
              </p>
            </div>
            
            <div className="space-x-2">
              {unansweredQuestions > 0 && (
                <Button
                  onClick={() => setShowConfirmSubmit(true)}
                  variant="outline"
                  disabled={submitting}
                >
                  Submit with Unanswered
                </Button>
              )}
              <Button
                onClick={() => unansweredQuestions > 0 ? setShowConfirmSubmit(true) : submitExam(false)}
                disabled={submitting}
                className="min-w-[120px]"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4 p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Confirm Submission</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to submit? You have {unansweredQuestions} unanswered question{unansweredQuestions !== 1 ? 's' : ''}.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setShowConfirmSubmit(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmSubmit(false)
                    submitExam(false)
                  }}
                  disabled={submitting}
                >
                  Submit Anyway
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
