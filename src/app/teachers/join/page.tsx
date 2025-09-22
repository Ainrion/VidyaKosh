'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, ArrowRight, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { toastMessages } from '@/lib/toast'

export default function TeacherJoinPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    schoolCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schoolInfo, setSchoolInfo] = useState<{name: string, address: string} | null>(null)
  const [validatingCode, setValidatingCode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get school code from URL params
    const code = searchParams.get('code')
    if (code) {
      setFormData(prev => ({ ...prev, schoolCode: code }))
      // Validate the school code
      validateSchoolCode(code)
    }
  }, [searchParams])

  const validateSchoolCode = async (code: string) => {
    try {
      setValidatingCode(true)
      const response = await fetch('/api/schools/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolCode: code }),
      })

      const data = await response.json()

      if (response.ok) {
        setSchoolInfo(data.school)
      } else {
        setError(data.error || 'Invalid school code')
      }
    } catch (err) {
      setError('Failed to validate school code')
    } finally {
      setValidatingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.fullName || !formData.schoolCode) {
        throw new Error('Please fill in all required fields')
      }

      // Validate password strength
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      if (!schoolInfo) {
        throw new Error('Please enter a valid school code')
      }

      // Submit teacher application
      const response = await fetch('/api/teachers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          schoolCode: formData.schoolCode.toUpperCase()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Application submission failed')
      }

      // Success - show toast and redirect to pending approval page
      toastMessages.auth.teacherApplicationSuccess()
      const schoolName = schoolInfo?.name || 'the school'
      router.push(`/teacher/pending-approval?email=${encodeURIComponent(formData.email)}&school=${encodeURIComponent(schoolName)}`)
    } catch (error: any) {
      console.error('Teacher application error:', error)
      setError(error.message || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join School Team
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join this school as a teacher
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teacher Registration</CardTitle>
            <CardDescription>
              Complete your registration to join the school team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* School Code Validation */}
            <div className="mb-6">
              <Label htmlFor="schoolCode">School Code</Label>
              <Input
                id="schoolCode"
                type="text"
                placeholder="Enter school code"
                value={formData.schoolCode}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, schoolCode: e.target.value.toUpperCase() }))
                  setError('')
                  if (e.target.value.length === 8) {
                    validateSchoolCode(e.target.value.toUpperCase())
                  }
                }}
                className="uppercase font-mono"
                required
              />
              {validatingCode && (
                <p className="text-sm text-blue-600 mt-1">Validating school code...</p>
              )}
            </div>

            {/* School Information Display */}
            {schoolInfo && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium text-green-800">{schoolInfo.name}</div>
                    <div className="text-sm text-green-600">{schoolInfo.address}</div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div className="text-red-800 text-sm">{error}</div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !schoolInfo || validatingCode}
                className="w-full"
              >
                {loading ? 'Joining School...' : 'Join School Team'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
