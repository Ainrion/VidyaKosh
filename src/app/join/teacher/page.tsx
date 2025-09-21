'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, User, Mail, School, Lock, ArrowRight, Loader2, Users, BookOpen } from 'lucide-react'
import Image from 'next/image'
import { toastMessages } from '@/lib/toast'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface TeacherJoinData {
  id: string
  email: string
  join_token: string
  message?: string
  school: {
    name: string
    email: string
    address: string
    logo_url?: string
  }
  invited_by_profile: {
    full_name: string
    email: string
  }
}

export default function TeacherJoinPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  })
  const [joinData, setJoinData] = useState<TeacherJoinData | null>(null)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [joinError, setJoinError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const joinToken = searchParams.get('token')
    if (joinToken) {
      validateJoinToken(joinToken)
    } else {
      setJoinError('No join link provided')
      setValidating(false)
    }
  }, [searchParams])

  const validateJoinToken = async (joinToken: string) => {
    try {
      const response = await fetch(`/api/teachers/join/validate?token=${encodeURIComponent(joinToken)}`)
      const data = await response.json()

      if (!response.ok) {
        setJoinError(data.error || 'Invalid join link')
        setValidating(false)
        return
      }

      setJoinData(data.joinData)
    } catch (error) {
      console.error('Error validating join token:', error)
      setJoinError('Failed to validate join link. Please try again.')
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

      if (!joinData) {
        throw new Error('Invalid join link. Please try again.')
      }

      console.log('Creating teacher account:', { 
        email: joinData.email,
        fullName: formData.fullName,
        joinToken: joinData.join_token
      })

      const response = await fetch('/api/teachers/join/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: joinData.email,
          password: formData.password,
          fullName: formData.fullName,
          joinToken: joinData.join_token
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Join API error:', data)
        throw new Error(data.error || 'Account creation failed')
      }

      // Check if user was automatically signed in
      if (data.session && data.redirectTo) {
        // User was automatically signed in, set the session and redirect to dashboard
        const supabase = createClient()
        
        // Set the session in the client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        })
        
        toastMessages.auth.signupSuccess()
        router.push(data.redirectTo)
      } else if (data.requiresManualSignIn) {
        // User needs to sign in manually
        toastMessages.auth.signupSuccess()
        router.push('/login?message=teacher-joined')
      } else {
        // Fallback to login page
        toastMessages.auth.signupSuccess()
        router.push('/login?message=teacher-joined')
      }
    } catch (error: any) {
      console.error('Error creating teacher account:', error)
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Join Link</h2>
            <p className="text-gray-600">Please wait while we verify your teacher join link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (joinError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <School className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Join Link</h2>
            <p className="text-gray-600 mb-6">{joinError}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Image 
                  src="/r-logo.svg" 
                  alt="Riven Logo" 
                  width={80} 
                  height={80}
                  className="h-20 w-20"
                />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Join as Teacher</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                You've been invited to join our teaching team. Complete your profile to get started.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* School Information */}
              {joinData && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                      <School className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{joinData.school?.name || 'School'}</h3>
                      <p className="text-sm text-gray-600">Educational Institution</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-emerald-600" />
                      <span className="text-gray-700"><strong>Your Email:</strong> {joinData.email}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-emerald-600" />
                      <span className="text-gray-700"><strong>Invited by:</strong> {joinData.invited_by_profile?.full_name || 'School Administrator'}</span>
                    </div>
                  </div>
                  
                  {joinData.message && (
                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-emerald-200">
                      <p className="text-sm text-gray-700">
                        <strong>Message:</strong> {joinData.message}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Teacher Benefits */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  What you'll get as a teacher:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Create and manage courses</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Track student progress</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Assign and grade work</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Communicate with students</span>
                  </div>
                </div>
              </motion.div>

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
                transition={{ duration: 0.3, delay: 0.4 }}
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
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Joining School...
                    </>
                  ) : (
                    <>
                      Join as Teacher
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
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
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

