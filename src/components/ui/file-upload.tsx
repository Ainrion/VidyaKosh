'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle, AlertCircle, Download, Eye, Trash2, FileText, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  onFileUpload?: (fileData: any) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
  disabled?: boolean
  className?: string
  placeholder?: string
  existingFile?: {
    name: string
    size: number
    url?: string
    type?: string
  }
  uploadEndpoint?: string
  uploadMetadata?: Record<string, string>
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  onFileUpload,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt'],
  maxSizeMB = 10,
  disabled = false,
  className,
  placeholder = "Drag and drop your file here, or click to browse",
  existingFile,
  uploadEndpoint,
  uploadMetadata
}: FileUploadProps) {
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
    if (!uploadEndpoint) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Add metadata if provided
      if (uploadMetadata) {
        Object.entries(uploadMetadata).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      // Create realistic progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return 85 // Leave room for final completion
          }
          return prev + Math.random() * 15
        })
      }, 300)

      const response = await fetch(uploadEndpoint, {
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
      
      return result
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

    // Upload to server if endpoint is provided
    if (uploadEndpoint && onFileUpload) {
      try {
        const result = await uploadFileToServer(file)
        onFileUpload(result.file || result)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Upload failed')
        setSelectedFile(null)
        onFileRemove()
      }
    }
  }, [validateFile, onFileSelect, onFileRemove, onFileUpload, uploadEndpoint, uploadMetadata])

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

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {existingFile || selectedFile ? (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(existingFile?.name || selectedFile?.name || '', existingFile?.type)}
              <div>
                <p className="font-medium text-green-800">
                  {existingFile?.name || selectedFile?.name}
                </p>
                <p className="text-sm text-green-600">
                  {formatFileSize(existingFile?.size || selectedFile?.size || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {existingFile?.url && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(existingFile.url, '_blank')}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = existingFile.url!
                      link.download = existingFile.name
                      link.click()
                    }}
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
                onClick={handleFileRemove}
                disabled={disabled || isUploading}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            isDragOver && !disabled && !isUploading
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed",
            error && "border-red-300 bg-red-50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="p-8 text-center">
            {error ? (
              <div className="space-y-2">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="text-red-600 font-medium">Upload Error</p>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : isUploading || (uploadProgress > 0 && uploadProgress < 100) ? (
              <div className="space-y-4">
                <Upload className="h-8 w-8 text-blue-500 mx-auto animate-pulse" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500">{Math.round(uploadProgress)}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {placeholder}
                  </p>
                  <p className="text-xs text-gray-500">
                    Accepted formats: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
