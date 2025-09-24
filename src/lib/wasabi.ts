import AWS from 'aws-sdk'

// Wasabi configuration with validation
const wasabiConfig = {
  accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
  secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
  region: process.env.WASABI_REGION || 'us-east-1',
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com',
  bucketName: process.env.WASABI_BUCKET_NAME || 'exam-question-files'
}

// Validate Wasabi configuration
function validateWasabiConfig() {
  const missing = []
  if (!wasabiConfig.accessKeyId) missing.push('WASABI_ACCESS_KEY_ID')
  if (!wasabiConfig.secretAccessKey) missing.push('WASABI_SECRET_ACCESS_KEY')
  if (!wasabiConfig.bucketName) missing.push('WASABI_BUCKET_NAME')
  
  if (missing.length > 0) {
    throw new Error(`Missing Wasabi configuration: ${missing.join(', ')}`)
  }
}

// Initialize S3 client for Wasabi with optimized settings
export const wasabiS3 = new AWS.S3({
  accessKeyId: wasabiConfig.accessKeyId,
  secretAccessKey: wasabiConfig.secretAccessKey,
  region: wasabiConfig.region,
  endpoint: wasabiConfig.endpoint,
  s3ForcePathStyle: true, // Required for Wasabi
  signatureVersion: 'v4',
  maxRetries: 3,
  retryDelayOptions: {
    base: 300
  },
  httpOptions: {
    timeout: 60000, // 60 seconds timeout
    connectTimeout: 10000 // 10 seconds connection timeout
  }
})

export const WASABI_BUCKET = wasabiConfig.bucketName

// Validate configuration on module load
try {
  validateWasabiConfig()
} catch (error) {
  console.warn('Wasabi configuration warning:', error.message)
}

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/xml',
    'application/xml',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.xml', '.jpg', '.jpeg', '.png']
}

// Generate unique file path for exam questions with school-based multi-tenant organization
export function generateExamQuestionFilePath(
  userId: string,
  examId: string,
  questionId: string,
  originalFileName: string,
  schoolId?: string
): string {
  const timestamp = Date.now()
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase()
  
  // Multi-tenant structure: schools/{schoolId}/exam-questions/{date}/{examId}/{questionId}/
  const schoolPrefix = schoolId ? `schools/${schoolId}` : 'schools/default'
  
  return `${schoolPrefix}/exam-questions/${date}/${examId}/${questionId}/${sanitizedFileName}-${timestamp}.${fileExtension}`
}

// Generate unique file path for exam answers with school-based multi-tenant organization
export function generateExamAnswerFilePath(
  userId: string,
  examSessionId: string,
  questionId: string,
  originalFileName: string,
  schoolId?: string
): string {
  const timestamp = Date.now()
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase()
  
  // Multi-tenant structure: schools/{schoolId}/exam-answers/{date}/{examSessionId}/{questionId}/
  const schoolPrefix = schoolId ? `schools/${schoolId}` : 'schools/default'
  
  return `${schoolPrefix}/exam-answers/${date}/${examSessionId}/${questionId}/${sanitizedFileName}-${timestamp}.${fileExtension}`
}

// Generate unique file path for assignment files with school-based multi-tenant organization
export function generateAssignmentFilePath(
  userId: string,
  courseId: string,
  assignmentId: string,
  originalFileName: string,
  schoolId?: string
): string {
  const timestamp = Date.now()
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase()
  
  // Multi-tenant structure: schools/{schoolId}/assignments/{date}/{courseId}/{assignmentId}/
  const schoolPrefix = schoolId ? `schools/${schoolId}` : 'schools/default'
  
  return `${schoolPrefix}/assignments/${date}/${courseId}/${assignmentId}/${sanitizedFileName}-${timestamp}.${fileExtension}`
}

// Generate unique file path for assignment submissions with school-based multi-tenant organization
export function generateAssignmentSubmissionFilePath(
  userId: string,
  courseId: string,
  assignmentId: string,
  originalFileName: string,
  schoolId?: string
): string {
  const timestamp = Date.now()
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileExtension = originalFileName.split('.').pop()?.toLowerCase()
  
  // Multi-tenant structure: schools/{schoolId}/assignment-submissions/{date}/{courseId}/{assignmentId}/{userId}/
  const schoolPrefix = schoolId ? `schools/${schoolId}` : 'schools/default'
  
  return `${schoolPrefix}/assignment-submissions/${date}/${courseId}/${assignmentId}/${userId}/${sanitizedFileName}-${timestamp}.${fileExtension}`
}

// Upload file to Wasabi with enhanced error handling
export async function uploadFileToWasabi(
  file: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ url: string; key: string; size: number }> {
  try {
    validateWasabiConfig()
    
    const params = {
      Bucket: WASABI_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read', // Make files publicly accessible
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'file-size': file.length.toString(),
        ...metadata
      },
      ServerSideEncryption: 'AES256' // Optional encryption
    }

    console.log(`Uploading file to Wasabi: ${key} (${file.length} bytes)`)
    
    const result = await wasabiS3.upload(params).promise()
    
    console.log(`File uploaded successfully: ${result.Location}`)
    
    return {
      url: result.Location,
      key: result.Key,
      size: file.length
    }
  } catch (error) {
    console.error('Wasabi upload error:', error)
    
    // Provide more specific error messages
    if (error.code === 'NoSuchBucket') {
      throw new Error('Wasabi bucket does not exist. Please create the bucket first.')
    } else if (error.code === 'InvalidAccessKeyId') {
      throw new Error('Invalid Wasabi access key. Please check your credentials.')
    } else if (error.code === 'SignatureDoesNotMatch') {
      throw new Error('Wasabi signature mismatch. Please check your secret key.')
    } else if (error.code === 'RequestTimeout') {
      throw new Error('Upload timeout. Please try again or check your connection.')
    } else {
      throw new Error(`Failed to upload file to Wasabi: ${error.message || 'Unknown error'}`)
    }
  }
}

// Delete file from Wasabi with enhanced error handling
export async function deleteFileFromWasabi(key: string): Promise<void> {
  try {
    validateWasabiConfig()
    
    const params = {
      Bucket: WASABI_BUCKET,
      Key: key
    }

    console.log(`Deleting file from Wasabi: ${key}`)
    await wasabiS3.deleteObject(params).promise()
    console.log(`File deleted successfully: ${key}`)
  } catch (error) {
    console.error('Wasabi delete error:', error)
    
    // Don't throw error for non-existent files
    if (error.code === 'NoSuchKey') {
      console.log(`File not found in Wasabi: ${key}`)
      return
    }
    
    throw new Error(`Failed to delete file from Wasabi: ${error.message || 'Unknown error'}`)
  }
}

// Check if file exists in Wasabi
export async function fileExistsInWasabi(key: string): Promise<boolean> {
  try {
    validateWasabiConfig()
    
    const params = {
      Bucket: WASABI_BUCKET,
      Key: key
    }

    await wasabiS3.headObject(params).promise()
    return true
  } catch (error) {
    if (error.code === 'NotFound' || error.statusCode === 404) {
      return false
    }
    throw error
  }
}

// Get file metadata from Wasabi
export async function getFileMetadata(key: string): Promise<{
  size: number;
  lastModified: Date;
  contentType: string;
  metadata: Record<string, string>;
}> {
  try {
    validateWasabiConfig()
    
    const params = {
      Bucket: WASABI_BUCKET,
      Key: key
    }

    const result = await wasabiS3.headObject(params).promise()
    
    return {
      size: result.ContentLength || 0,
      lastModified: result.LastModified || new Date(),
      contentType: result.ContentType || 'application/octet-stream',
      metadata: result.Metadata || {}
    }
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw new Error(`Failed to get file metadata: ${error.message || 'Unknown error'}`)
  }
}

// Generate signed URL for file access
export function generateSignedUrl(key: string, expiresIn: number = 3600): string {
  const params = {
    Bucket: WASABI_BUCKET,
    Key: key,
    Expires: expiresIn
  }

  return wasabiS3.getSignedUrl('getObject', params)
}

// Validate file type and size
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size must be less than ${FILE_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`
    }
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`
    }
  }

  // Check MIME type
  if (!FILE_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed MIME types: ${FILE_UPLOAD_CONFIG.allowedTypes.join(', ')}`
    }
  }

  return { isValid: true }
}

