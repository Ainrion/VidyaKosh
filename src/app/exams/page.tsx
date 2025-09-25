'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
// DashboardLayout is now handled globally in AppLayout
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Save, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ExamQuestionFileUpload } from '@/components/ui/exam-question-file-upload'

interface Course {
  id: string
  title: string
}

interface Exam {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  start_time: string | null
  end_time: string | null
  is_published: boolean
  course_id: string
  courses: {
    title: string
  }
}

interface ExamQuestion {
  id?: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'file_upload' | 'subjective'
  options: string[]
  correct_answer: string
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

export default function ExamsPage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [exams, setExams] = useState<Exam[]>([])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)

  // Exam form state
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    start_time: '',
    end_time: '',
    course_id: ''
  })

  // Questions state
  const [questions, setQuestions] = useState<ExamQuestion[]>([])

  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    try {
      if (!profile || !profile.school_id) {
        console.log('No profile or school_id found, skipping courses fetch')
        return
      }

      let query = supabase
        .from('courses')
        .select('id, title')
        .eq('school_id', profile.school_id)
        .eq('archived', false)
        .order('title')

      // Filter based on user role
      if (profile.role === 'teacher') {
        // Teachers can only see their own courses
        query = query.eq('created_by', profile.id)
      }
      // Admins can see all courses in their school (already filtered by school_id above)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching courses:', error)
        toast.error('Failed to fetch courses')
        return
      }
      
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
    }
  }, [profile, supabase])

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true)
      
      // First check if the user has permission and school_id
      if (!profile || !profile.school_id) {
        console.log('No profile or school_id found, skipping exam fetch')
        return
      }

      let query = supabase
        .from('exams')
        .select(`
          *,
          courses (title, school_id)
        `)
        .eq('school_id', profile.school_id) // Filter by school_id for multi-tenant isolation
        .order('created_at', { ascending: false })

      // Filter based on user role (maintaining school isolation)
      if (profile.role === 'teacher') {
        // Teachers can only see their own exams within their school
        query = query.eq('created_by', profile.id)
      }
      // Admins can see all exams in their school (already filtered by school_id above)

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        toast.error(`Failed to fetch exams: ${error.message}`)
        return
      }
      
      console.log('Fetched exams for school:', profile.school_id, data)
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to fetch exams. Please check your permissions.')
    } finally {
      setLoading(false)
    }
  }, [profile, supabase])

  useEffect(() => {
    if (profile) {
      fetchCourses()
      fetchExams()
    }
  }, [profile, fetchCourses, fetchExams])

  const addQuestion = () => {
    const newQuestion: ExamQuestion = {
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      order_index: questions.length,
      file_requirements: {
        allowed_types: ['.pdf', '.doc', '.docx'],
        max_size_mb: 10,
        instructions: 'Upload your answer sheet as a PDF or Word document.'
      },
      word_limit: undefined,
      rich_text_enabled: false
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof ExamQuestion, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setQuestions(updatedQuestions)
  }

  const updateFileRequirements = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[index].file_requirements) {
      updatedQuestions[index].file_requirements = {
        allowed_types: ['.pdf', '.doc', '.docx'],
        max_size_mb: 10,
        instructions: 'Upload your answer sheet as a PDF or Word document.'
      }
    }
    updatedQuestions[index].file_requirements = {
      ...updatedQuestions[index].file_requirements!,
      [field]: value
    }
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    setQuestions(updatedQuestions)
  }

  const saveExam = async () => {
    try {
      if (!examForm.title || !examForm.course_id) {
        toast.error('Please fill in all required fields')
        return
      }

      // Save exam - handle empty timestamps
      const examData = {
        ...examForm,
        start_time: examForm.start_time && examForm.start_time.trim() !== '' ? examForm.start_time : null,
        end_time: examForm.end_time && examForm.end_time.trim() !== '' ? examForm.end_time : null,
        created_by: profile?.id,
        school_id: profile?.school_id,
        is_published: true // Ensure exams are published by default
      }

      console.log('Saving exam with data:', examData)

      let examId: string

      if (editingExam) {
        const { error } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', editingExam)
        
        if (error) throw error
        examId = editingExam.id
      } else {
        const { data, error } = await supabase
          .from('exams')
          .insert(examData)
          .select('id')
          .single()
        
        if (error) throw error
        examId = data.id
      }

      // Save questions
      if (questions.length > 0) {
        // Delete existing questions if editing
        if (editingExam) {
          await supabase
            .from('exam_questions')
            .delete()
            .eq('exam_id', examId)
        }

        const questionsData = questions.map((q, index) => ({
          exam_id: examId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'multiple_choice' ? q.options : null,
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: index,
          file_requirements: q.file_requirements || null,
          word_limit: q.word_limit || null,
          rich_text_enabled: q.rich_text_enabled || false,
          file_path: q.file_path || null,
          file_name: q.file_name || null,
          file_size: q.file_size || null,
          mime_type: q.mime_type || null
        }))

        const { error: questionsError } = await supabase
          .from('exam_questions')
          .insert(questionsData)

        if (questionsError) throw questionsError
      }

      toast.success(editingExam ? 'Exam updated successfully' : 'Exam created successfully')
      setShowCreateForm(false)
      setEditingExam(null)
      resetForm()
      fetchExams()
    } catch (error) {
      console.error('Error saving exam:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error(`Failed to save exam: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const resetForm = () => {
    setExamForm({
      title: '',
      description: '',
      duration_minutes: 60,
      start_time: '',
      end_time: '',
      course_id: ''
    })
    setQuestions([])
  }

  const editExam = async (examId: string) => {
    try {
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index')

      if (questionsError) throw questionsError

      setExamForm({
        title: examData.title,
        description: examData.description || '',
        duration_minutes: examData.duration_minutes,
        start_time: examData.start_time ? new Date(examData.start_time).toISOString().slice(0, 16) : '',
        end_time: examData.end_time ? new Date(examData.end_time).toISOString().slice(0, 16) : '',
        course_id: examData.course_id
      })

      setQuestions(questionsData.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || ['', '', '', ''],
        correct_answer: q.correct_answer || '',
        points: q.points || 1,
        order_index: q.order_index || 0,
        file_requirements: q.file_requirements || {
          allowed_types: ['.pdf', '.doc', '.docx'],
          max_size_mb: 10,
          instructions: 'Upload your answer sheet as a PDF or Word document.'
        },
        word_limit: q.word_limit || undefined,
        rich_text_enabled: q.rich_text_enabled || false
      })))

      setEditingExam(examData)
      setShowCreateForm(true)
    } catch (error) {
      console.error('Error fetching exam:', error)
      toast.error('Failed to load exam')
    }
  }

  const togglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_published: !currentStatus })
        .eq('id', examId)

      if (error) throw error
      
      toast.success(currentStatus ? 'Exam unpublished' : 'Exam published')
      fetchExams()
    } catch (error) {
      console.error('Error updating exam:', error)
      toast.error('Failed to update exam')
    }
  }

  if (loading) {
    return (
      <div className="p-6">Loading exams...</div>    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exams</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Create/Edit Exam Form */}
      {showCreateForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingExam ? 'Edit Exam' : 'Create New Exam'}
          </h2>
          
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="Enter exam title"
                />
              </div>
              
              <div>
                <Label htmlFor="course">Course *</Label>
                <select
                  id="course"
                  value={examForm.course_id}
                  onChange={(e) => setExamForm({ ...examForm, course_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                placeholder="Enter exam description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={examForm.duration_minutes}
                  onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={examForm.start_time}
                  onChange={(e) => setExamForm({ ...examForm, start_time: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={examForm.end_time}
                  onChange={(e) => setExamForm({ ...examForm, end_time: e.target.value })}
                />
              </div>
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Questions</h3>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <Card key={index} className="p-4 mb-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <Label>Question {index + 1}</Label>
                      <Button
                        onClick={() => removeQuestion(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Question input - show different UI based on question type */}
                    {question.question_type === 'file_upload' ? (
                      <div className="space-y-4">
                        <Label>Question File</Label>
                        <ExamQuestionFileUpload
                          examId={editingExam?.id || `temp-exam-${Date.now()}`}
                          questionId={question.id || `temp-${index}`}
                          onFileSelect={(file) => {
                            // Update question with file info for preview
                            updateQuestion(index, 'question_text', file.name)
                            updateQuestion(index, 'file_name', file.name)
                            updateQuestion(index, 'file_size', file.size)
                            updateQuestion(index, 'mime_type', file.type)
                          }}
                          onFileUpload={(fileData) => {
                            // Update question with uploaded file data
                            updateQuestion(index, 'question_text', fileData.url || fileData.name)
                            updateQuestion(index, 'file_name', fileData.name)
                            updateQuestion(index, 'file_size', fileData.size)
                            updateQuestion(index, 'mime_type', fileData.type)
                            updateQuestion(index, 'file_path', fileData.path)
                          }}
                          onFileRemove={() => {
                            updateQuestion(index, 'question_text', '')
                            updateQuestion(index, 'file_name', '')
                            updateQuestion(index, 'file_size', 0)
                            updateQuestion(index, 'mime_type', '')
                            updateQuestion(index, 'file_path', '')
                          }}
                          existingFile={question.file_name ? {
                            name: question.file_name,
                            size: question.file_size || 0,
                            url: question.question_text,
                            type: question.mime_type
                          } : undefined}
                          placeholder="Upload a file containing the question (PDF, DOC, DOCX, TXT, XML, JPG, PNG)"
                        />
                      </div>
                    ) : (
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                        placeholder="Enter question text"
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Question Type</Label>
                        <select
                          value={question.question_type}
                          onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="essay">Essay</option>
                          <option value="subjective">Subjective (Written)</option>
                          <option value="file_upload">File Upload</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                          min="1"
                        />
                      </div>

                      {/* Word limit for essay and subjective questions */}
                      {(question.question_type === 'essay' || question.question_type === 'subjective') && (
                        <div>
                          <Label>Word Limit (optional)</Label>
                          <Input
                            type="number"
                            value={question.word_limit || ''}
                            onChange={(e) => updateQuestion(index, 'word_limit', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="e.g., 500"
                            min="1"
                          />
                        </div>
                      )}
                    </div>

                    {/* Rich text option for essay and subjective questions */}
                    {(question.question_type === 'essay' || question.question_type === 'subjective') && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`rich-text-${index}`}
                          checked={question.rich_text_enabled || false}
                          onChange={(e) => updateQuestion(index, 'rich_text_enabled', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`rich-text-${index}`} className="text-sm">
                          Enable rich text formatting (bold, italic, etc.)
                        </Label>
                      </div>
                    )}

                    {/* File requirements for file upload questions */}
                    {question.question_type === 'file_upload' && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium">File Upload Requirements</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Allowed File Types</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png'].map(type => (
                                <label key={type} className="flex items-center gap-1 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={question.file_requirements?.allowed_types.includes(type) || false}
                                    onChange={(e) => {
                                      const currentTypes = question.file_requirements?.allowed_types || []
                                      const newTypes = e.target.checked
                                        ? [...currentTypes, type]
                                        : currentTypes.filter(t => t !== type)
                                      updateFileRequirements(index, 'allowed_types', newTypes)
                                    }}
                                    className="rounded"
                                  />
                                  {type}
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label>Maximum File Size (MB)</Label>
                            <Input
                              type="number"
                              value={question.file_requirements?.max_size_mb || 10}
                              onChange={(e) => updateFileRequirements(index, 'max_size_mb', parseInt(e.target.value))}
                              min="1"
                              max="50"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Upload Instructions</Label>
                          <Textarea
                            value={question.file_requirements?.instructions || ''}
                            onChange={(e) => updateFileRequirements(index, 'instructions', e.target.value)}
                            placeholder="e.g., Upload your answer sheet as a PDF. Make sure your handwriting is clear and readable."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}

                    {/* Options for multiple choice */}
                    {question.question_type === 'multiple_choice' && (
                      <div>
                        <Label>Options</Label>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2 mt-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optIndex] = e.target.value
                                updateQuestion(index, 'options', newOptions)
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            <Button
                              onClick={() => updateQuestion(index, 'correct_answer', option)}
                              variant={question.correct_answer === option ? "default" : "outline"}
                              size="sm"
                            >
                              Correct
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True/False options */}
                    {question.question_type === 'true_false' && (
                      <div>
                        <Label>Correct Answer</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => updateQuestion(index, 'correct_answer', 'true')}
                            variant={question.correct_answer === 'true' ? "default" : "outline"}
                            size="sm"
                          >
                            True
                          </Button>
                          <Button
                            onClick={() => updateQuestion(index, 'correct_answer', 'false')}
                            variant={question.correct_answer === 'false' ? "default" : "outline"}
                            size="sm"
                          >
                            False
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={saveExam}>
                <Save className="h-4 w-4 mr-2" />
                {editingExam ? 'Update Exam' : 'Save Exam'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingExam(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Exams List */}
      <div className="space-y-4">
        {exams.map((exam) => (
          <Card key={exam.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{exam.title}</h3>
                  <Badge variant={exam.is_published ? "default" : "secondary"}>
                    {exam.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600">{exam.courses.title}</p>
                
                {exam.description && (
                  <p className="text-sm text-gray-500">{exam.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {exam.duration_minutes} minutes
                  </div>
                  
                  {exam.start_time && (
                    <div>
                      Starts: {new Date(exam.start_time).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => editExam(exam.id)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
                
                <Button
                  onClick={() => togglePublish(exam.id, exam.is_published)}
                  variant={exam.is_published ? "secondary" : "default"}
                  size="sm"
                >
                  {exam.is_published ? 'Unpublish' : 'Publish'}
                </Button>
                
                <Link href={`/exams/${exam.id}/grade`}>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Grade
                  </Button>
                </Link>
                
                <Link href={`/exams/${exam.id}/results`}>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Results
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
        
        {exams.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No exams created yet. Click &quot;Create Exam&quot; to get started.
          </div>
        )}
      </div>
    </div>  )
}
