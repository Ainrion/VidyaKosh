'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle, AlertCircle, FileText, Image, Download, Eye, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignmentFileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  onFileUpload?: (fileData: any) => void
  courseId: string
  assignmentId?: string
  acceptedTypes?: string[]
  maxSizeMB?: number
  disabled?: boolean
  className?: string
  existingFile?: {
    name: string
    size: number
    url?: string
    type?: string
  }
  placeholder?: string
}

export function AssignmentFileUpload({
  onFileSelect,
  onFileRemove,
  onFileUpload,
  courseId,
  assignmentId,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.xml', '.jpg', '.jpeg', '.png', '.xls', '.xlsx'],
  maxSizeMB = 50,
  disabled = false,
  className,
  existingFile,
  placeholder = "Drag and drop your assignment file here, or click to browse"
}: AssignmentFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }

    return null
  }, [acceptedTypes, maxSizeMB])

  const uploadFileToServer = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      if (assignmentId) {
        formData.append('assignmentId', assignmentId)
      }

      // Create a more realistic progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return 85 // Leave room for final completion
          }
          return prev + Math.random() * 15 // Random increments for more realistic feel
        })
      }, 300)

      const response = await fetch('/api/assignments/upload-file', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Call the upload callback with file data
      if (onFileUpload) {
        onFileUpload(result.file)
      }

      return result.file
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    setUploadProgress(0)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    
    // Call the file select callback
    onFileSelect(file)

    // Upload to server if callback is provided
    if (onFileUpload) {
      try {
        await uploadFileToServer(file)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Upload failed')
        setSelectedFile(null)
        onFileRemove()
      }
    }
  }, [validateFile, onFileSelect, onFileRemove, onFileUpload, courseId, assignmentId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, isUploading, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, isUploading])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null)
    setUploadProgress(0)
    setError(null)
    onFileRemove()
  }, [onFileRemove])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <Image className="h-6 w-6 text-blue-500" />
    }
    
    if (['pdf'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-red-500" />
    }
    
    if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-blue-600" />
    }

    if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-green-600" />
    }
    
    return <File className="h-6 w-6 text-gray-500" />
  }

  const handleDownload = useCallback(() => {
    if (existingFile?.url) {
      window.open(existingFile.url, '_blank')
    }
  }, [existingFile?.url])

  const handlePreview = useCallback(() => {
    if (existingFile?.url) {
      // For images, open in new tab
      if (existingFile.type?.startsWith('image/')) {
        window.open(existingFile.url, '_blank')
      } else {
        // For PDFs and other files, open in new tab
        window.open(existingFile.url, '_blank')
      }
    }
  }, [existingFile?.url, existingFile?.type])

  const handleDelete = useCallback(async () => {
    if (!existingFile?.url) return

    try {
      const url = new URL(existingFile.url)
      const filePath = url.pathname.substring(1) // Remove leading slash

      const response = await fetch(`/api/assignments/upload-file?filePath=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onFileRemove()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError('Failed to delete file')
    }
  }, [existingFile?.url, onFileRemove])

  // Show existing file if available
  if (existingFile && !selectedFile) {
    return (
      <div className={cn("w-full", className)}>
        <Card className="border-2 border-green-200 bg-green-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(existingFile.name, existingFile.type)}
                <div>
                  <p className="font-medium text-green-800">{existingFile.name}</p>
                  <p className="text-sm text-green-600">{formatFileSize(existingFile.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {existingFile.url && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={disabled}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver && "border-blue-400 bg-blue-50",
          error && "border-red-300 bg-red-50",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <div className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-blue-500 mx-auto animate-pulse" />
              <div>
                <p className="text-lg font-medium text-blue-700">Uploading...</p>
                <p className="text-sm text-blue-600">Please wait while we upload your file</p>
              </div>
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
            </div>
          ) : selectedFile ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getFileIcon(selectedFile.name, selectedFile.type)}
                  <p className="font-medium text-green-800">{selectedFile.name}</p>
                </div>
                <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileRemove()
                }}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <X className="h-4 w-4 mr-1" />
                Remove File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className={cn(
                "h-12 w-12 mx-auto",
                error ? "text-red-500" : "text-gray-400"
              )} />
              <div>
                <p className="text-lg font-medium text-gray-700">{placeholder}</p>
                <p className="text-sm text-gray-500">
                  Supported formats: {acceptedTypes.join(', ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum file size: {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
