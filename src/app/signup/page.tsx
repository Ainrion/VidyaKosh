'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Building2, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Shield,
  Zap,
  Heart
} from 'lucide-react'
import Image from 'next/image'
import { toastMessages } from '@/lib/toast'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    schoolName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect users to appropriate pages based on role or invitation
  useEffect(() => {
    const roleParam = searchParams.get('role')
    const code = searchParams.get('code')
    const inviteParam = searchParams.get('invite')
    
    // If no role specified, redirect to teacher landing page
    if (!roleParam && !code && !inviteParam) {
      router.push('/teachers')
      return
    }
    
    // Handle role-based redirects
    if (roleParam === 'teacher') {
      router.push('/teachers')
      return
    }

    if (roleParam === 'student') {
      router.push('/students')
        return
      }

    // Handle invitation codes
    if (code || inviteParam) {
      const invitationCode = code || inviteParam
      // Redirect to student signup with invitation
      router.push(`/students?${code ? 'code' : 'invite'}=${invitationCode}`)
      return
    }
    
    // Only allow admin signup on this page
    if (roleParam !== 'admin') {
      router.push('/teachers')
      return
    }
  }, [searchParams, router])

  // Admin signup form submission
  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.fullName || !formData.schoolName) {
        throw new Error('Please fill in all required fields')
      }

      // Validate password strength
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      // Create admin account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          schoolName: formData.schoolName,
          role: 'admin'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Account creation failed')
      }

      // Success - show admin-specific message and redirect to login
      if (data.message && data.message.includes('ready to login')) {
        toastMessages.auth.adminSignupSuccess()
      } else {
        toastMessages.auth.signupSuccess()
      }
      router.push('/login?message=admin-created')
    } catch (error: any) {
      console.error('Admin signup error:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Only show admin signup form if role=admin is specified
  const isAdminSignup = searchParams.get('role') === 'admin'

  if (!isAdminSignup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
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
              Create Your <span className="text-purple-600">School</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Set up your educational institution and start managing teachers, students, and courses with Riven's comprehensive learning management system.
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
                  <Building2 className="h-6 w-6 mr-2 text-purple-600" />
                  School Administrator Signup
              </CardTitle>
                <CardDescription>
                  Create your school account and start building your educational community
              </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAdminSignup} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="fullName">Your Full Name</Label>
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

                    <div>
                      <Label htmlFor="schoolName">School Name</Label>
                        <Input
                          id="schoolName"
                          type="text"
                          value={formData.schoolName}
                          onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                        placeholder="Enter your school name"
                        required
                        className="mt-1"
                        />
                      </div>
                    </div>
                    
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                    
                    <Button 
                      type="submit" 
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating School...
                      </>
                    ) : (
                      <>
                        Create School Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                    </Button>
                </form>
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
                What You'll Get
              </h2>
              <p className="text-gray-600 mb-6">
                Everything you need to manage your educational institution
              </p>
        </div>
        
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">User Management</h3>
                  <p className="text-sm text-gray-600">
                    Invite teachers and manage student enrollments with ease.
                  </p>
                </div>
        </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Course Management</h3>
                  <p className="text-sm text-gray-600">
                    Create and organize courses, lessons, and assignments.
                  </p>
                </div>
        </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Secure Platform</h3>
                  <p className="text-sm text-gray-600">
                    Enterprise-grade security with data encryption and access controls.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Real-time Collaboration</h3>
                  <p className="text-sm text-gray-600">
                    Interactive tools for teachers and students to collaborate effectively.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
                <p className="text-sm text-gray-600">
                  Track student progress and engagement
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
                <p className="text-sm text-gray-600">
                  Built-in messaging and announcements
                </p>
                      </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Assessment</h4>
                <p className="text-sm text-gray-600">
                  Create quizzes and track grades
                </p>
                    </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Support</h4>
                <p className="text-sm text-gray-600">
                  24/7 support for your school
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
              Empowering educational institutions with modern learning tools.
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/teachers" className="text-gray-400 hover:text-white">
                Join as Teacher
              </Link>
              <Link href="/students" className="text-gray-400 hover:text-white">
                Join as Student
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