'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, User, Mail, School, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { toastMessages } from '@/lib/toast'
import { motion } from 'framer-motion'

interface Invitation {
  id: string
  email: string
  invitation_code: string
  message?: string
  school: {
    name: string
    email: string
    address: string
  }
  invited_by_profile: {
    full_name: string
    email: string
  }
}

export default function TeacherCompleteProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  })
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [invitationError, setInvitationError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const inviteCode = searchParams.get('invite')
    if (inviteCode) {
      validateInvitation(inviteCode)
    } else {
      setInvitationError('No invitation code provided')
      setValidating(false)
    }
  }, [searchParams])

  const validateInvitation = async (inviteCode: string) => {
    try {
      const response = await fetch(`/api/invitations/validate?code=${encodeURIComponent(inviteCode)}`)
      const data = await response.json()

      if (!response.ok) {
        setInvitationError(data.error || 'Invalid invitation code')
        setValidating(false)
        return
      }

      // Check if this is a teacher invitation
      if (data.invitation.role !== 'teacher') {
        setInvitationError('This invitation is not for teachers. Please contact your administrator.')
        setValidating(false)
        return
      }

      setInvitation(data.invitation)
      // Auto-fill email from invitation
      setFormData(prev => ({ ...prev, fullName: '' }))
    } catch (error) {
      console.error('Error validating invitation:', error)
      setInvitationError('Failed to validate invitation. Please try again.')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.fullName || !formData.password || !formData.confirmPassword) {
        throw new Error('Please fill in all required fields')
      }

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Validate password strength
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      if (!invitation) {
        throw new Error('Invalid invitation. Please try again.')
      }

      console.log('Creating teacher account:', { 
        email: invitation.email,
        fullName: formData.fullName,
        invitationCode: invitation.invitation_code
      })

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invitation.email,
          password: formData.password,
          fullName: formData.fullName,
          role: 'teacher',
          invitationCode: invitation.invitation_code
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Signup API error:', data)
        throw new Error(data.error || 'Account creation failed')
      }

      toastMessages.auth.signupSuccess()
      router.push('/login?message=account-created')
    } catch (error: any) {
      console.error('Error creating teacher account:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating Invitation</h2>
            <p className="text-gray-600">Please wait while we verify your invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{invitationError}</p>
            <Button 
              onClick={() => router.push('/signup')}
              className="w-full"
            >
              Go to Signup Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</CardTitle>
              <CardDescription className="text-gray-600">
                You've been invited to join as a teacher. Complete your profile to get started.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Invitation Details */}
              {invitation && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                    <span className="font-medium text-emerald-800">Invitation Details</span>
                  </div>
                  <div className="space-y-2 text-sm text-emerald-700">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span><strong>Email:</strong> {invitation.email}</span>
                    </div>
                    <div className="flex items-center">
                      <School className="h-4 w-4 mr-2" />
                      <span><strong>School:</strong> {invitation.school?.name || 'Unknown School'}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span><strong>Invited by:</strong> {invitation.invited_by_profile?.full_name || 'School Administrator'}</span>
                    </div>
                    {invitation.message && (
                      <div className="mt-2 p-2 bg-emerald-100 rounded text-emerald-800">
                        <strong>Message:</strong> {invitation.message}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a strong password"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your password"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.form>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

