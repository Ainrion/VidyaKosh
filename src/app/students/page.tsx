'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Mail, 
  UserPlus, 
  School, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  BookOpen, 
  MessageSquare,
  Sparkles,
  Shield,
  Zap,
  Heart
} from 'lucide-react'
import Image from 'next/image'
import { toastMessages } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

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

export default function StudentsPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    invitationCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [validatingInvitation, setValidatingInvitation] = useState(false)
  const [invitationError, setInvitationError] = useState('')
  const [showSignupForm, setShowSignupForm] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for invitation code in URL params
  useEffect(() => {
    const code = searchParams.get('code')
    const inviteParam = searchParams.get('invite')
    
    if (code) {
      setFormData(prev => ({ ...prev, invitationCode: code }))
      validateInvitationAndSetup(code)
    } else if (inviteParam) {
      validateInvitationAndSetup(inviteParam)
    }
  }, [searchParams])

  const validateInvitationAndSetup = async (invitationCode: string) => {
    setValidatingInvitation(true)
    try {
      const response = await fetch(`/api/invitations/validate?code=${invitationCode}`)
      if (response.ok) {
        const data = await response.json()
        const { invitation } = data
        
        if (invitation) {
          setInvitation(invitation)
          setFormData(prev => ({ 
            ...prev, 
            invitationCode: invitationCode,
            email: invitation.email || ''
          }))
          setShowSignupForm(true)
        }
      } else {
        const errorData = await response.json()
        setInvitationError(errorData.error || 'Invalid invitation code')
      }
    } catch (error) {
      console.error('Error validating invitation:', error)
      setInvitationError('Failed to validate invitation. Please try again.')
    } finally {
      setValidatingInvitation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.fullName || !formData.invitationCode) {
        throw new Error('Please fill in all required fields')
      }

      // Validate password strength
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      // Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          invitationCode: formData.invitationCode,
          role: 'student'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Account creation failed')
      }

      // Success - redirect to login
      toastMessages.auth.signupSuccess()
      router.push('/login?message=student-joined')
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.invitationCode.trim()) return
    
    await validateInvitationAndSetup(formData.invitationCode.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-3">
                <Image 
                  src="/r-logo.svg" 
                  alt="Riven Logo" 
                  width={32} 
                  height={32}
                  className="h-8 w-8"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Riven</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/teachers" className="text-gray-600 hover:text-gray-900">
                Join as Teacher
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Join as a <span className="text-green-600">Student</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Access your courses, assignments, and collaborate with your classmates on Riven. 
              You'll need an invitation code from your teacher to get started.
            </p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <UserPlus className="h-6 w-6 mr-2 text-green-600" />
                  Create Your Account
                </CardTitle>
                <CardDescription>
                  {invitation 
                    ? `You're invited to join ${invitation.school.name}`
                    : 'Enter your invitation code to get started'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showSignupForm ? (
                  // Invitation Code Form
                  <form onSubmit={handleInvitationCodeSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="invitationCode">Invitation Code</Label>
                      <Input
                        id="invitationCode"
                        type="text"
                        value={formData.invitationCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, invitationCode: e.target.value }))}
                        placeholder="Enter your invitation code"
                        required
                        className="mt-1"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Get this code from your teacher or school administrator
                      </p>
                    </div>

                    {invitationError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{invitationError}</p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={validatingInvitation || !formData.invitationCode.trim()}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {validatingInvitation ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Validating...
                        </>
                      ) : (
                        <>
                          Validate Code
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  // Signup Form
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {invitation && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Invitation Validated
                            </p>
                            <p className="text-sm text-green-600">
                              You're joining {invitation.school.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Create a password"
                          required
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Must be at least 6 characters long
                        </p>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowSignupForm(false)}
                        className="px-4"
                      >
                        Back
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What You'll Get Access To
              </h2>
              <p className="text-gray-600 mb-6">
                Join thousands of students who are already learning with Riven
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Course Materials</h3>
                  <p className="text-sm text-gray-600">
                    Access all your course content, assignments, and resources in one place.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Collaboration</h3>
                  <p className="text-sm text-gray-600">
                    Chat with classmates, ask questions, and collaborate on projects.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Progress Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Track your progress, view grades, and stay on top of assignments.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Class Community</h3>
                  <p className="text-sm text-gray-600">
                    Connect with your classmates and build a supportive learning community.
                  </p>
                </div>
              </div>
            </div>

            {/* Need Help Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Don't have an invitation code? Contact your teacher or school administrator.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <strong>For students:</strong> Ask your teacher for an invitation code
                </p>
                <p className="text-gray-600">
                  <strong>For teachers:</strong> <Link href="/teachers" className="text-green-600 hover:underline">Join as a teacher</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-8 w-8 mr-3">
                <Image 
                  src="/r-logo.svg" 
                  alt="Riven Logo" 
                  width={32} 
                  height={32}
                  className="h-8 w-8"
                />
              </div>
              <h3 className="text-2xl font-bold">Riven</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering students and educators with modern learning tools.
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/teachers" className="text-gray-400 hover:text-white">
                Join as Teacher
              </Link>
              <Link href="/login" className="text-gray-400 hover:text-white">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}