'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Code, 
  FileText, 
  CheckCircle, 
  Clock,
  Settings,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface QuizBuilderProps {
  courseId: string
  onQuizSaved?: (quiz: any) => void
}

interface Question {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding'
  question_text: string
  points: number
  time_limit_seconds?: number
  options?: string[]
  correct_answer?: string
  // Coding specific fields
  language?: string
  starter_code?: string
  solution_code?: string
  test_cases?: TestCase[]
}

interface TestCase {
  id: string
  input: string
  expected_output: string
  is_hidden: boolean
}

export function QuizBuilder({ courseId, onQuizSaved }: QuizBuilderProps) {
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  const programmingLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' }
  ]

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type,
      question_text: '',
      points: 1,
      time_limit_seconds: type === 'coding' ? 300 : undefined,
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      correct_answer: '',
      language: type === 'coding' ? 'javascript' : undefined,
      starter_code: type === 'coding' ? '// Write your code here' : undefined,
      solution_code: '',
      test_cases: type === 'coding' ? [] : undefined
    }
    
    setQuestions(prev => [...prev, newQuestion])
    setEditingQuestion(newQuestion)
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ))
    
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const deleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null)
    }
  }

  const addTestCase = (questionId: string) => {
    const newTestCase: TestCase = {
      id: `tc_${Date.now()}`,
      input: '',
      expected_output: '',
      is_hidden: false
    }
    
    updateQuestion(questionId, {
      test_cases: [...(editingQuestion?.test_cases || []), newTestCase]
    })
  }

  const updateTestCase = (questionId: string, testCaseId: string, updates: Partial<TestCase>) => {
    const question = questions.find(q => q.id === questionId)
    if (!question?.test_cases) return

    const updatedTestCases = question.test_cases.map(tc =>
      tc.id === testCaseId ? { ...tc, ...updates } : tc
    )
    
    updateQuestion(questionId, { test_cases: updatedTestCases })
  }

  const deleteTestCase = (questionId: string, testCaseId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question?.test_cases) return

    const updatedTestCases = question.test_cases.filter(tc => tc.id !== testCaseId)
    updateQuestion(questionId, { test_cases: updatedTestCases })
  }

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      toast.error('Please enter a quiz title')
      return
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    setSaving(true)
    try {
      console.log('Saving quiz with data:', {
        title: quizTitle,
        description: quizDescription,
        course_id: courseId,
        questions: questions
      })

      // Save quiz to database
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          course_id: courseId,
          questions: questions
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save quiz')
      }

      const data = await response.json()
      console.log('Quiz saved successfully:', data)

      // Call the callback with the saved quiz
      onQuizSaved?.(data.quiz)
      toast.success('Quiz saved successfully!')
      
      // Reset form
      setQuizTitle('')
      setQuizDescription('')
      setQuestions([])
      setEditingQuestion(null)
      
    } catch (error) {
      console.error('Error saving quiz:', error)
      toast.error(`Failed to save quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const getQuestionTypeIcon = (type: Question['type']) => {
    switch (type) {
      case 'coding':
        return <Code className="h-4 w-4" />
      case 'multiple_choice':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getQuestionTypeLabel = (type: Question['type']) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice'
      case 'true_false':
        return 'True/False'
      case 'short_answer':
        return 'Short Answer'
      case 'essay':
        return 'Essay'
      case 'coding':
        return 'Coding Question'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="quiz-title">Quiz Title *</Label>
            <Input
              id="quiz-title"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title"
              className="text-lg font-semibold"
            />
          </div>
          
          <div>
            <Label htmlFor="quiz-description">Description</Label>
            <Textarea
              id="quiz-description"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Describe what this quiz covers..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={saveQuiz} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Quiz'}
            </Button>
          </div>
        </div>

        {questions.map((question, index) => (
          <Card key={question.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">
                  Question {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {getQuestionTypeIcon(question.type)}
                  <Badge variant="secondary">
                    {getQuestionTypeLabel(question.type)}
                  </Badge>
                </div>
                <Badge variant="outline">
                  {question.points} point{question.points !== 1 ? 's' : ''}
                </Badge>
                {question.time_limit_seconds && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(question.time_limit_seconds / 60)}m
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingQuestion(question)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">{question.question_text || 'Untitled Question'}</p>
              
              {question.type === 'coding' && (
                <div className="text-sm text-gray-600">
                  <span>Language: {question.language}</span>
                  {question.test_cases && (
                    <span className="ml-4">
                      Test Cases: {question.test_cases.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}

        {/* Add Question Buttons */}
        <Card className="p-4 border-dashed">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">Add a new question</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion('multiple_choice')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Multiple Choice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion('true_false')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                True/False
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion('short_answer')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Short Answer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion('essay')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Essay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion('coding')}
              >
                <Code className="h-4 w-4 mr-2" />
                Coding
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Question Editor Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Edit {getQuestionTypeLabel(editingQuestion.type)} Question
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setEditingQuestion(null)}
                >
                  ×
                </Button>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label>Question Text *</Label>
                <Textarea
                  value={editingQuestion.question_text}
                  onChange={(e) => updateQuestion(editingQuestion.id, { question_text: e.target.value })}
                  placeholder="Enter your question..."
                  rows={3}
                />
              </div>

              {/* Points and Time Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points *</Label>
                  <Input
                    type="number"
                    value={editingQuestion.points}
                    onChange={(e) => updateQuestion(editingQuestion.id, { points: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
                
                {editingQuestion.type === 'coding' && (
                  <div className="space-y-2">
                    <Label>Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={editingQuestion.time_limit_seconds || 300}
                      onChange={(e) => updateQuestion(editingQuestion.id, { time_limit_seconds: parseInt(e.target.value) || 300 })}
                      min="60"
                    />
                  </div>
                )}
              </div>

              {/* Programming Language for Coding Questions */}
              {editingQuestion.type === 'coding' && (
                <div className="space-y-2">
                  <Label>Programming Language</Label>
                  <Select
                    value={editingQuestion.language || 'javascript'}
                    onValueChange={(value) => updateQuestion(editingQuestion.id, { language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {programmingLanguages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Multiple Choice Options */}
              {editingQuestion.type === 'multiple_choice' && editingQuestion.options && (
                <div className="space-y-4">
                  <Label>Answer Options</Label>
                  {editingQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...editingQuestion.options!]
                          newOptions[index] = e.target.value
                          updateQuestion(editingQuestion.id, { options: newOptions })
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        variant={editingQuestion.correct_answer === option ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateQuestion(editingQuestion.id, { correct_answer: option })}
                      >
                        Correct
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* True/False Options */}
              {editingQuestion.type === 'true_false' && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={editingQuestion.correct_answer === 'true' ? "default" : "outline"}
                      onClick={() => updateQuestion(editingQuestion.id, { correct_answer: 'true' })}
                    >
                      True
                    </Button>
                    <Button
                      variant={editingQuestion.correct_answer === 'false' ? "default" : "outline"}
                      onClick={() => updateQuestion(editingQuestion.id, { correct_answer: 'false' })}
                    >
                      False
                    </Button>
                  </div>
                </div>
              )}

              {/* Coding Question Specific Fields */}
              {editingQuestion.type === 'coding' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Starter Code</Label>
                    <Textarea
                      value={editingQuestion.starter_code || ''}
                      onChange={(e) => updateQuestion(editingQuestion.id, { starter_code: e.target.value })}
                      placeholder="// Write your code here"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Solution Code (for auto-grading)</Label>
                    <Textarea
                      value={editingQuestion.solution_code || ''}
                      onChange={(e) => updateQuestion(editingQuestion.id, { solution_code: e.target.value })}
                      placeholder="// Correct solution"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Test Cases */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Test Cases</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTestCase(editingQuestion.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>

                    {editingQuestion.test_cases?.map((testCase, index) => (
                      <Card key={testCase.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Test Case {index + 1}</span>
                            <div className="flex gap-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={testCase.is_hidden}
                                  onChange={(e) => updateTestCase(editingQuestion.id, testCase.id, { is_hidden: e.target.checked })}
                                />
                                Hidden
                              </label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTestCase(editingQuestion.id, testCase.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Input</Label>
                              <Textarea
                                value={testCase.input}
                                onChange={(e) => updateTestCase(editingQuestion.id, testCase.id, { input: e.target.value })}
                                placeholder="Test input"
                                rows={2}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Expected Output</Label>
                              <Textarea
                                value={testCase.expected_output}
                                onChange={(e) => updateTestCase(editingQuestion.id, testCase.id, { expected_output: e.target.value })}
                                placeholder="Expected output"
                                rows={2}
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Question */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingQuestion(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setEditingQuestion(null)}
                  disabled={!editingQuestion.question_text.trim()}
                >
                  Save Question
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
