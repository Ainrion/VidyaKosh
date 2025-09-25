// File Management Utilities for Wasabi Storage
import { 
  uploadFileToWasabi, 
  deleteFileFromWasabi, 
  fileExistsInWasabi, 
  getFileMetadata,
  generateExamQuestionFilePath,
  generateExamAnswerFilePath,
  generateAssignmentFilePath,
  generateAssignmentSubmissionFilePath,
  validateFile,
  FILE_UPLOAD_CONFIG 
} from './wasabi'

export interface FileInfo {
  id?: string
  name: string
  size: number
  type: string
  url: string
  path: string
  uploadedAt?: string
  metadata?: Record<string, string>
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// Enhanced file upload with progress tracking
export async function uploadFileWithProgress(
  file: File,
  uploadType: 'question' | 'answer' | 'assignment' | 'assignment-submission',
  metadata: {
    userId: string
    schoolId?: string
    examId?: string
    questionId?: string
    examSessionId?: string
    courseId?: string
    assignmentId?: string
  },
  onProgress?: (progress: UploadProgress) => void
): Promise<FileInfo> {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Convert to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Generate file path based on upload type with school isolation
    let filePath: string
    switch (uploadType) {
      case 'question':
        filePath = generateExamQuestionFilePath(metadata.userId, metadata.examId!, metadata.questionId!, file.name, metadata.schoolId)
        break
      case 'answer':
        filePath = generateExamAnswerFilePath(metadata.userId, metadata.examSessionId!, metadata.questionId!, file.name, metadata.schoolId)
        break
      case 'assignment':
        filePath = generateAssignmentFilePath(metadata.userId, metadata.courseId!, metadata.assignmentId!, file.name, metadata.schoolId)
        break
      case 'assignment-submission':
        filePath = generateAssignmentSubmissionFilePath(metadata.userId, metadata.courseId!, metadata.assignmentId!, file.name, metadata.schoolId)
        break
      default:
        throw new Error(`Unsupported upload type: ${uploadType}`)
    }

    // Upload with metadata
    const uploadMetadata: Record<string, string> = {
      'user-id': metadata.userId,
      'original-name': file.name,
      'upload-type': uploadType,
      'upload-timestamp': new Date().toISOString()
    }

    // Add type-specific metadata
    if (metadata.schoolId) uploadMetadata['school-id'] = metadata.schoolId
    if (metadata.examId) uploadMetadata['exam-id'] = metadata.examId
    if (metadata.questionId) uploadMetadata['question-id'] = metadata.questionId
    if (metadata.examSessionId) uploadMetadata['exam-session-id'] = metadata.examSessionId
    if (metadata.courseId) uploadMetadata['course-id'] = metadata.courseId
    if (metadata.assignmentId) uploadMetadata['assignment-id'] = metadata.assignmentId

    const uploadResult = await uploadFileToWasabi(fileBuffer, filePath, file.type, uploadMetadata)

    return {
      name: file.name,
      size: uploadResult.size,
      type: file.type,
      url: uploadResult.url,
      path: uploadResult.key,
      uploadedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

// Delete file with cleanup
export async function deleteFile(filePath: string): Promise<void> {
  try {
    // Check if file exists before attempting deletion
    const exists = await fileExistsInWasabi(filePath)
    if (!exists) {
      console.log('File does not exist, skipping deletion:', filePath)
      return
    }

    await deleteFileFromWasabi(filePath)
    console.log('File deleted successfully:', filePath)
  } catch (error) {
    console.error('File deletion error:', error)
    throw error
  }
}

// Get file information
export async function getFileInfo(filePath: string): Promise<FileInfo | null> {
  try {
    const exists = await fileExistsInWasabi(filePath)
    if (!exists) {
      return null
    }

    const metadata = await getFileMetadata(filePath)
    
    return {
      name: filePath.split('/').pop() || 'Unknown',
      size: metadata.size,
      type: metadata.contentType,
      url: `https://${process.env.WASABI_BUCKET_NAME}.s3.${process.env.WASABI_REGION}.wasabisys.com/${filePath}`,
      path: filePath,
      uploadedAt: metadata.metadata['uploaded-at'],
      metadata: metadata.metadata
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    return null
  }
}

// Batch delete files
export async function deleteMultipleFiles(filePaths: string[]): Promise<{
  successful: string[]
  failed: { path: string; error: string }[]
}> {
  const results = await Promise.allSettled(
    filePaths.map(path => deleteFile(path))
  )

  const successful: string[] = []
  const failed: { path: string; error: string }[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(filePaths[index])
    } else {
      failed.push({
        path: filePaths[index],
        error: result.reason.message || 'Unknown error'
      })
    }
  })

  return { successful, failed }
}

// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// File type validator
export function isValidFileType(fileName: string, allowedTypes: string[] = FILE_UPLOAD_CONFIG.allowedExtensions): boolean {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase()
  return allowedTypes.includes(extension)
}

// File type icon getter
export function getFileTypeIcon(fileName: string, mimeType?: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image'
  }
  
  if (['pdf'].includes(extension || '')) {
    return 'pdf'
  }
  
  if (['doc', 'docx'].includes(extension || '')) {
    return 'document'
  }
  
  if (['txt', 'xml'].includes(extension || '')) {
    return 'text'
  }
  
  return 'file'
}

// Generate preview URL for different file types
export function getPreviewUrl(fileInfo: FileInfo): string | null {
  const icon = getFileTypeIcon(fileInfo.name, fileInfo.type)
  
  switch (icon) {
    case 'image':
      return fileInfo.url
    case 'pdf':
      return fileInfo.url // PDFs can be previewed in browser
    default:
      return null // No preview available
  }
}

// File upload status tracker
export class UploadTracker {
  private uploads: Map<string, UploadProgress> = new Map()

  startUpload(uploadId: string): void {
    this.uploads.set(uploadId, { loaded: 0, total: 0, percentage: 0 })
  }

  updateProgress(uploadId: string, progress: UploadProgress): void {
    this.uploads.set(uploadId, progress)
  }

  getProgress(uploadId: string): UploadProgress | null {
    return this.uploads.get(uploadId) || null
  }

  completeUpload(uploadId: string): void {
    this.uploads.delete(uploadId)
  }

  getAllUploads(): Map<string, UploadProgress> {
    return new Map(this.uploads)
  }
}

export const uploadTracker = new UploadTracker()
