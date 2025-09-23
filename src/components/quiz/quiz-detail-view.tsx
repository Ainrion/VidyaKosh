'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Clock, 
  Users, 
  Play, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Code,
  BookOpen,
  Target
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
}

interface QuizDetailViewProps {
  quiz: Quiz
  onEdit?: (quiz: Quiz) => void
  onDelete?: (quizId: string) => void
  onTakeQuiz?: (quiz: Quiz) => void
  canManage?: boolean
  userRole?: string
}

export function QuizDetailView({ 
  quiz, 
  onEdit, 
  onDelete, 
  onTakeQuiz, 
  canManage = false,
  userRole = 'student'
}: QuizDetailViewProps) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const getQuestionType = (question: QuizQuestion) => {
    if (question.options && question.options.length > 0) {
      return 'multiple_choice'
    }
    return 'short_answer'
  }

  const getQuestionTypeIcon = (question: QuizQuestion) => {
    const type = getQuestionType(question)
    switch (type) {
      case 'multiple_choice':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'short_answer':
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />
    }
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

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                {quiz.title}
              </CardTitle>
              {quiz.description && (
                <CardDescription className="text-base">
                  {quiz.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Quiz
              </Badge>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(quiz)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(quiz.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Created: {formatDate(quiz.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{quiz.quiz_questions?.length || 0} Questions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Course Quiz</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Actions */}
      <div className="flex items-center justify-between">
        {userRole === 'student' ? (
          // Student view - only show Take Quiz button
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Click "Take Quiz" to start the quiz and see questions
            </span>
          </div>
        ) : (
          // Teacher/Admin view - show answer toggle
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowAnswers(!showAnswers)}
              variant="outline"
              size="sm"
            >
              {showAnswers ? 'Hide' : 'Show'} Answers
            </Button>
            <span className="text-sm text-gray-500">
              {showAnswers ? 'Answers are visible' : 'Answers are hidden'}
            </span>
          </div>
        )}
        {onTakeQuiz && (
          <Button onClick={() => onTakeQuiz(quiz)} className="bg-blue-600 hover:bg-blue-700">
            <Play className="h-4 w-4 mr-2" />
            Take Quiz
          </Button>
        )}
      </div>

      {/* Questions - Only show to teachers and admins */}
      {userRole !== 'student' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Questions ({quiz.quiz_questions?.length || 0})
          </h3>
          
          {!quiz.quiz_questions || quiz.quiz_questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-500 text-center">
                  This quiz doesn't have any questions yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {quiz.quiz_questions
                .sort((a, b) => a.order_index - b.order_index)
                .map((question, index) => {
                  const isExpanded = expandedQuestions.has(question.id)
                  const questionType = getQuestionType(question)
                  
                  return (
                    <Card key={question.id} className="hover:shadow-md transition-shadow">
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleQuestionExpansion(question.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2">
                              {getQuestionTypeIcon(question)}
                              <span className="text-sm font-medium text-gray-500">
                                Q{index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2">
                                {question.question}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {questionType === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
                                </Badge>
                                {question.options && (
                                  <span className="text-xs text-gray-500">
                                    {question.options.length} options
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? '▼' : '▶'}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {/* Question Options */}
                            {question.options && question.options.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Options:</h4>
                                <div className="space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className={`flex items-center gap-2 p-2 rounded-md ${
                                        showAnswers && option === question.correct_answer
                                          ? 'bg-green-50 border border-green-200'
                                          : 'bg-gray-50'
                                      }`}
                                    >
                                      <span className="text-sm font-medium text-gray-500">
                                        {String.fromCharCode(65 + optionIndex)}.
                                      </span>
                                      <span className="text-sm">{option}</span>
                                      {showAnswers && option === question.correct_answer && (
                                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Correct Answer */}
                            {showAnswers && question.correct_answer && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <h4 className="text-sm font-medium text-green-800 mb-1">Correct Answer:</h4>
                                <p className="text-sm text-green-700">{question.correct_answer}</p>
                              </div>
                            )}
                            
                            {/* Question Metadata */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                              <span>Order: {question.order_index}</span>
                              <span>Type: {questionType}</span>
                              <span>ID: {question.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Student view - Show quiz info without questions */}
      {userRole === 'student' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to take the quiz?</h3>
            <p className="text-gray-500 text-center mb-4">
              This quiz has {quiz.quiz_questions?.length || 0} questions. Click "Take Quiz" to start.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Created: {formatDate(quiz.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
