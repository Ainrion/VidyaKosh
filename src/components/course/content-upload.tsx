'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  File, 
  Video, 
  Music, 
  Image, 
  FileText, 
  Presentation,
  X,
  Plus,
  Tag,
  BookOpen,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface ContentUploadProps {
  courseId: string
  onContentAdded?: (content: any) => void
}

interface ContentType {
  id: string
  name: string
  mime_type: string
  file_extension: string
  max_size_mb: number
}

interface Subject {
  id: string
  name: string
  code: string
  color: string
}

interface Grade {
  id: string
  name: string
  level: number
}

export function ContentUpload({ courseId, onContentAdded }: ContentUploadProps) {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: '',
    duration_minutes: 0,
    difficulty_level: 'beginner',
    is_required: true
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const getContentTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />
    if (mimeType.includes('presentation')) return <Presentation className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file)
    
    // Auto-detect content type based on file
    const detectedType = contentTypes.find(type => 
      file.type === type.mime_type || 
      file.name.toLowerCase().endsWith(type.file_extension?.toLowerCase() || '')
    )
    
    if (detectedType) {
      setFormData(prev => ({ ...prev, content_type: detectedType.id }))
    }
  }, [contentTypes])

  const handleFileRemove = useCallback(() => {
    setUploadedFile(null)
    setFormData(prev => ({ ...prev, content_type: '' }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadedFile || !formData.title || !formData.content_type) {
      toast.error('Please fill in all required fields and upload a file')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      // Here you would implement the actual file upload logic
      // For now, we'll simulate a successful upload
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newContent = {
        id: `content_${Date.now()}`,
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        file_name: uploadedFile.name,
        file_size: uploadedFile.size,
        duration_minutes: formData.duration_minutes,
        difficulty_level: formData.difficulty_level,
        is_required: formData.is_required,
        subjects: selectedSubject ? [selectedSubject] : [],
        grades: selectedGrade ? [selectedGrade] : [],
        topics: selectedTopics,
        uploaded_at: new Date().toISOString()
      }

      onContentAdded?.(newContent)
      toast.success('Content uploaded successfully!')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        content_type: '',
        duration_minutes: 0,
        difficulty_level: 'beginner',
        is_required: true
      })
      setUploadedFile(null)
      setSelectedSubject('')
      setSelectedGrade('')
      setSelectedTopics([])

    } catch (error) {
      toast.error('Failed to upload content')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const addTopic = () => {
    const topicName = prompt('Enter topic name:')
    if (topicName && !selectedTopics.includes(topicName)) {
      setSelectedTopics(prev => [...prev, topicName])
    }
  }

  const removeTopic = (topic: string) => {
    setSelectedTopics(prev => prev.filter(t => t !== topic))
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload Course Content</h3>
          <p className="text-sm text-gray-600">
            Add videos, documents, presentations, and other learning materials to your course.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Content Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content_type">Content Type *</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(type.mime_type)}
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this content..."
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File *</Label>
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              acceptedTypes={contentTypes.map(t => t.file_extension).filter(Boolean)}
              maxSizeMB={contentTypes.find(t => t.id === formData.content_type)?.max_size_mb || 50}
              existingFile={uploadedFile ? {
                name: uploadedFile.name,
                size: uploadedFile.size
              } : undefined}
              placeholder="Drag and drop your file here, or click to browse"
            />
          </div>

          {/* Content Properties */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                min="0"
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Required Content</Label>
              <Select
                value={formData.is_required ? 'required' : 'optional'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, is_required: value === 'required' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Tagging */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <Label className="text-sm font-medium">Content Tagging</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: subject.color }}
                          />
                          <span>{subject.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Topics</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                    {topic}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTopic(topic)}
                    />
                  </Badge>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTopic}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Topic
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading content...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={uploading || !uploadedFile || !formData.title}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Content'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
