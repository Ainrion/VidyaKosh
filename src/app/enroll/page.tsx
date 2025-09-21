'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Link, CheckCircle, XCircle, Clock, Users, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toastMessages } from '@/lib/toast'

interface EnrollmentCode {
  id: string
  code: string
  title: string
  description: string
  expires_at?: string
  max_uses?: number
  current_uses: number
  course: {
    id: string
    title: string
    description: string
  }
  created_by_profile: {
    full_name: string
    email: string
  }
}

export default function EnrollPage() {
  const [code, setCode] = useState('')
  const [enrollmentCode, setEnrollmentCode] = useState<EnrollmentCode | null>(null)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile } = useAuth()

  useEffect(() => {
    // Check if code is provided in URL
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(urlCode)
      validateCode(urlCode)
    }
  }, [searchParams])

  const validateCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) {
      setError('Please enter an enrollment code')
      return
    }

    try {
      setValidating(true)
      setError('')
      setEnrollmentCode(null)

      // Try the enhanced API first, then fallback to original
      let response = await fetch(`/api/enrollment-codes/use-enhanced?code=${encodeURIComponent(codeToValidate)}`)
      let data = await response.json()
      
      // If enhanced API fails, try original
      if (!response.ok) {
        console.log('Enhanced API failed, trying original...')
        response = await fetch(`/api/enrollment-codes/use?code=${encodeURIComponent(codeToValidate)}`)
        data = await response.json()
      }

      if (!response.ok) {
        throw new Error(data.error || 'Invalid enrollment code')
      }

      setEnrollmentCode(data.code)
      toastMessages.enrollment.enrollmentCodeUsed()
    } catch (error) {
      console.error('Error validating code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate code'
      setError(errorMessage)
      setEnrollmentCode(null)
      toastMessages.enrollment.enrollmentCodeInvalid()
    } finally {
      setValidating(false)
    }
  }

  const useCode = async () => {
    if (!enrollmentCode) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Try the enhanced API first, then fallback to original
      let response = await fetch('/api/enrollment-codes/use-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: enrollmentCode.code,
          courseId: enrollmentCode.course?.id 
        })
      })

      let data = await response.json()
      
      // If enhanced API fails, try original
      if (!response.ok) {
        console.log('Enhanced API failed, trying original...')
        response = await fetch('/api/enrollment-codes/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: enrollmentCode.code })
        })
        data = await response.json()
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to use enrollment code')
      }

      setSuccess(data.message)
      toastMessages.enrollment.enrolled(data.course_title || 'the course')
      setTimeout(() => {
        router.push('/courses')
      }, 2000)
    } catch (error) {
      console.error('Error using code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to use enrollment code'
      setError(errorMessage)
      toastMessages.enrollment.enrollmentError(errorMessage)
    } finally {
      setLoading(false)
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

  const getRemainingUses = (code: EnrollmentCode) => {
    if (!code.max_uses) return 'Unlimited'
    return Math.max(0, code.max_uses - code.current_uses)
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in to use enrollment codes.
            </p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profile.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only students can use enrollment codes to join courses.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile.school_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">School Access Required</h2>
            <p className="text-gray-600 mb-4">
              You need school access to join courses. Please contact your administrator or use a school invitation.
            </p>
            <Button onClick={() => router.push('/signup')}>
              Join with Invitation
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Join Course with Code</h1>
          <p className="text-gray-600">
            Enter a course enrollment code to join a specific course
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Code</CardTitle>
            <CardDescription>
              Enter the code provided by your teacher
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="code"
                  placeholder="Enter enrollment code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button
                  onClick={() => validateCode(code)}
                  disabled={validating || !code.trim()}
                >
                  {validating ? 'Validating...' : 'Validate'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {enrollmentCode && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{enrollmentCode.title}</CardTitle>
                  <CardDescription>{enrollmentCode.course.title}</CardDescription>
                </div>
                <Badge variant="default" className="text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valid
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollmentCode.description && (
                <p className="text-sm text-gray-600">{enrollmentCode.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Course</p>
                  <p className="text-gray-600">{enrollmentCode.course.title}</p>
                </div>
                <div>
                  <p className="font-medium">Created by</p>
                  <p className="text-gray-600">{enrollmentCode.created_by_profile.full_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Uses</p>
                  <p className="text-gray-600">
                    {enrollmentCode.current_uses} / {enrollmentCode.max_uses || '∞'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Remaining</p>
                  <p className="text-gray-600">{getRemainingUses(enrollmentCode)}</p>
                </div>
              </div>

              {enrollmentCode.expires_at && (
                <div className="text-sm">
                  <p className="font-medium">Expires</p>
                  <p className="text-gray-600">{formatDate(enrollmentCode.expires_at)}</p>
                </div>
              )}

              {isExpired(enrollmentCode.expires_at) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-500 mr-2" />
                    <p className="text-red-700 text-sm">This code has expired</p>
                  </div>
                </div>
              )}

              {enrollmentCode.max_uses && enrollmentCode.current_uses >= enrollmentCode.max_uses && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-500 mr-2" />
                    <p className="text-red-700 text-sm">This code has reached maximum uses</p>
                  </div>
                </div>
              )}

              <Button
                onClick={useCode}
                disabled={loading || isExpired(enrollmentCode.expires_at) || !!(enrollmentCode.max_uses && enrollmentCode.current_uses >= enrollmentCode.max_uses)}
                className="w-full"
              >
                {loading ? 'Joining...' : 'Join Course'}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an enrollment code?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/courses')}>
              Browse available courses
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}

