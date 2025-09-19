'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Mail, UserPlus, School, GraduationCap, Sparkles, ArrowRight, Users, BookOpen, Award, Shield, Zap, Heart, RefreshCw } from 'lucide-react'
import { toastMessages } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    schoolName: '',
    role: 'admin' as 'admin' | 'teacher' | 'student',
    invitationCode: ''
  })
  const [invitationFormData, setInvitationFormData] = useState({
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
  const [activeTab, setActiveTab] = useState('invitation') // Default to student signup
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for invitation code in URL params
  useEffect(() => {
    const code = searchParams.get('code')
    const roleParam = searchParams.get('role')
    const inviteParam = searchParams.get('invite')
    
    if (code) {
      if (roleParam === 'teacher') {
        // Teacher invitation - switch to regular signup tab and set role
        setFormData(prev => ({ ...prev, role: 'teacher', invitationCode: code }))
        setActiveTab('regular') // Switch to admin/teacher signup tab
      } else {
        // Student invitation - use invitation tab
        setInvitationFormData(prev => ({ ...prev, invitationCode: code }))
        setActiveTab('invitation') // Stay on student signup tab
      }
    } else if (inviteParam) {
      // Handle both teacher and student invitations with ?invite=CODE format
      // We need to validate the invitation to determine the role
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
        
        if (invitation.role === 'teacher') {
          // Teacher invitation - switch to regular signup tab and set role
          setFormData(prev => ({ ...prev, role: 'teacher', invitationCode }))
          setActiveTab('regular') // Switch to admin/teacher signup tab
        } else {
          // Student invitation - use invitation tab
          setInvitationFormData(prev => ({ ...prev, invitationCode }))
          setActiveTab('invitation') // Stay on student signup tab
          // Auto-validate the invitation
          handleInvitationCodeChange(invitationCode)
        }
      } else {
        setInvitationError('Invalid or expired invitation code')
      }
    } catch (error) {
      console.error('Error validating invitation:', error)
      setInvitationError('Error validating invitation code')
    } finally {
      setValidatingInvitation(false)
    }
  }

  const validateInvitationCode = async (code: string) => {
    if (!code.trim()) {
      setInvitation(null)
      setInvitationError('')
      return
    }

    setValidatingInvitation(true)
    setInvitationError('')

    try {
      const response = await fetch(`/api/invitations/validate?code=${encodeURIComponent(code)}`)
      const data = await response.json()

      if (!response.ok) {
        setInvitationError(data.error || 'Invalid invitation code')
        setInvitation(null)
        return
      }

      setInvitation(data.invitation)
      setInvitationFormData(prev => ({ 
        ...prev, 
        email: data.invitation.email 
      }))
    } catch (error) {
      console.error('Error validating invitation:', error)
      setInvitationError('Failed to validate invitation code')
      setInvitation(null)
    } finally {
      setValidatingInvitation(false)
    }
  }

  const handleInvitationCodeChange = (code: string) => {
    setInvitationFormData(prev => ({ ...prev, invitationCode: code }))
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateInvitationCode(code)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleInvitationSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setInvitationError('')

    try {
      // Validate required fields
      if (!invitationFormData.email || !invitationFormData.password || !invitationFormData.fullName || !invitationFormData.invitationCode) {
        throw new Error('Please fill in all required fields')
      }

      // Validate invitation before proceeding
      if (!invitation) {
        throw new Error('Please enter a valid invitation code')
      }

      console.log('Sending invitation signup data:', { 
        email: invitationFormData.email, 
        fullName: invitationFormData.fullName, 
        role: 'student',
        invitationCode: invitationFormData.invitationCode,
        password: '[HIDDEN]'
      })

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invitationFormData.email,
          password: invitationFormData.password,
          fullName: invitationFormData.fullName,
          role: 'student',
          invitationCode: invitationFormData.invitationCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Invitation signup API error:', data)
        throw new Error(data.error || 'Signup failed')
      }

      toastMessages.auth.signupSuccess()
      router.push('/login')
    } catch (error) {
      console.error('Error in invitation signup:', error)
      const errorMessage = error instanceof Error ? error.message : 'Signup failed'
      setInvitationError(errorMessage)
      toastMessages.auth.signupError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.fullName) {
        throw new Error('Please fill in all required fields')
      }

      // Include invitation code for teachers if present in URL or stored in form
      const code = searchParams.get('code')
      const roleParam = searchParams.get('role')
      const signupData = { ...formData }
      
      // Handle invitation codes for different scenarios
      if (code && roleParam === 'teacher' && formData.role === 'teacher') {
        signupData.invitationCode = code
      } else if (formData.invitationCode && formData.role === 'teacher') {
        signupData.invitationCode = formData.invitationCode
      }

      // For admin role, ensure schoolName is provided if no schoolId
      if (formData.role === 'admin' && !signupData.schoolId && !signupData.schoolName) {
        throw new Error('School name is required for admin registration')
      }

      // For teacher role without invitation, ensure schoolName is provided
      if (formData.role === 'teacher' && !signupData.invitationCode && !signupData.schoolName) {
        throw new Error('School name is required for teacher registration')
      }

      console.log('Sending signup data:', { ...signupData, password: '[HIDDEN]' })

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Signup API error:', data)
        throw new Error(data.error || 'Signup failed')
      }

      toastMessages.auth.signupSuccess()
      router.push('/login')
    } catch (error) {
      console.error('Error in signup:', error)
      const errorMessage = error instanceof Error ? error.message : 'Signup failed'
      setError(errorMessage)
      toastMessages.auth.signupError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized for speed and seamless user experience'
    },
    {
      icon: Heart,
      title: 'Made with Love',
      description: 'Crafted by educators, for educators and students'
    }
  ]

  const roleDescriptions = {
    admin: 'Full access to manage school, users, and all content. Create school first from landing page.',
    teacher: 'Create courses, manage students, and track progress. Preferably use invitation link from admin.',
    student: 'Access courses, submit assignments, and track learning. Requires invitation code.'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex">
      {/* Left Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Join Riven
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Start your educational journey today
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
                  <TabsTrigger 
                    value="invitation"
                    className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-medium"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Student Signup
                  </TabsTrigger>
                  <TabsTrigger 
                    value="regular" 
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Admin/Teacher Signup
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="regular" className="space-y-6">
                  <motion.form 
                    onSubmit={handleSignup} 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                          {((searchParams.get('code') && searchParams.get('role') === 'teacher') || (formData.invitationCode && formData.role === 'teacher')) && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg"
                            >
                              <div className="flex items-center">
                                <Mail className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">Teacher Invitation</span>
                              </div>
                              <p className="text-sm mt-1">
                                You've been invited to join as a teacher. Please complete your registration below.
                              </p>
                            </motion.div>
                          )}

                          {validatingInvitation && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg"
                            >
                              <div className="flex items-center">
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                <span className="text-sm font-medium">Validating Invitation</span>
                              </div>
                              <p className="text-sm mt-1">
                                Please wait while we validate your invitation...
                              </p>
                            </motion.div>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
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
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
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

                    {/* Only show school name field if not coming from teacher invitation */}
                    {!(searchParams.get('code') && searchParams.get('role') === 'teacher') && !formData.invitationCode && (
                      <div className="space-y-2">
                        <Label htmlFor="schoolName" className="text-sm font-medium text-gray-700">School Name</Label>
                        <Input
                          id="schoolName"
                          type="text"
                          value={formData.schoolName}
                          onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                          placeholder="Enter your school name exactly as it should appear"
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required={formData.role === 'admin'}
                        />
                        <p className="text-xs text-gray-500">
                          {formData.role === 'teacher' ? 
                            "If you have an invitation link from your admin, use that instead for automatic school assignment." :
                            "For admin registration, create the school first from the landing page."
                          }
                        </p>
                      </div>
                    )}

                    {/* Show school assignment info for teacher invitations */}
                    {((searchParams.get('code') && searchParams.get('role') === 'teacher') || formData.invitationCode) && formData.role === 'teacher' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                          <span className="text-sm font-medium text-emerald-800">School Assignment</span>
                        </div>
                        <p className="text-sm text-emerald-700 mt-1">
                          You'll be automatically assigned to the correct school from your invitation.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Role</Label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Students must sign up using an invitation code. Teachers should preferably use invitation links from their school admin. Use the "Student Signup" tab for invitation codes.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {(['admin', 'teacher'] as const).map((role) => (
                          <motion.div
                            key={role}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              formData.role === role 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}>
                              <input
                                type="radio"
                                name="role"
                                value={role}
                                checked={formData.role === role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'teacher' | 'student' }))}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                                formData.role === role ? 'border-blue-500' : 'border-gray-300'
                              }`}>
                                {formData.role === role && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 capitalize">{role}</div>
                                <div className="text-sm text-gray-600">{roleDescriptions[role]}</div>
                              </div>
                            </label>
                          </motion.div>
                        ))}
                      </div>

                      {/* Additional info for teachers without invitation */}
                      {formData.role === 'teacher' && !(searchParams.get('code') && searchParams.get('role') === 'teacher') && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start">
                            <Mail className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium text-amber-800">Recommended: Use Invitation Link</span>
                              <p className="text-sm text-amber-700 mt-1">
                                Ask your school administrator to send you an invitation link for automatic school assignment and a smoother signup process.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </motion.form>
                </TabsContent>

                <TabsContent value="invitation" className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-2">
                      <School className="h-5 w-5 text-emerald-600 mr-2" />
                      <h3 className="font-semibold text-emerald-800">Student Signup</h3>
                    </div>
                    <p className="text-sm text-emerald-700">
                      You need an invitation code from your school administrator to create a student account. 
                      Check your email for the invitation or contact your school.
                    </p>
                    <p className="text-xs text-emerald-600 mt-2">
                      <strong>Teachers:</strong> If you received an invitation link via email, click that link instead of using this form.
                    </p>
                  </div>
                  
                  <motion.form 
                    onSubmit={handleInvitationSignup} 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {invitationError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                      >
                        {invitationError}
                      </motion.div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="invitationCode" className="text-sm font-medium text-gray-700">Invitation Code</Label>
                      <Input
                        id="invitationCode"
                        type="text"
                        value={invitationFormData.invitationCode}
                        onChange={(e) => handleInvitationCodeChange(e.target.value)}
                        placeholder="Enter your invitation code"
                        className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                      {validatingInvitation && (
                        <p className="text-sm text-gray-500">Validating invitation code...</p>
                      )}
                    </div>

                    <AnimatePresence>
                      {invitation && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"
                        >
                          <div className="flex items-center mb-3">
                            <CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
                            <span className="font-medium text-emerald-800">Valid Invitation</span>
                          </div>
                          <div className="space-y-2 text-sm text-emerald-700">
                            <p><strong>School:</strong> {invitation.school?.name || 'Unknown School'}</p>
                            <p><strong>Invited by:</strong> {invitation.invited_by_profile?.full_name || 'School Administrator'}</p>
                            <p><strong>Email:</strong> {invitation.email}</p>
                            {invitation.message && <p><strong>Message:</strong> {invitation.message}</p>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invitationFullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                        <Input
                          id="invitationFullName"
                          type="text"
                          value={invitationFormData.fullName}
                          onChange={(e) => setInvitationFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                          className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invitationEmail" className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          id="invitationEmail"
                          type="email"
                          value={invitationFormData.email}
                          onChange={(e) => setInvitationFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                          className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                          disabled={!!invitation}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="invitationPassword" className="text-sm font-medium text-gray-700">Password</Label>
                      <Input
                        id="invitationPassword"
                        type="password"
                        value={invitationFormData.password}
                        onChange={(e) => setInvitationFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Create a strong password"
                        className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={loading || !invitation}
                      className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Account...' : 'Accept Invitation & Sign Up'}
                    </Button>
                  </motion.form>
                </TabsContent>
              </Tabs>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Already have an account?
                </p>
                <Link 
                  href="/login" 
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 group"
                >
                  <span>Sign in to your account</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Side - Benefits & Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <Users className="h-10 w-10 text-white" />
          </motion.div>
        </div>
        
        <div className="absolute top-40 right-32">
          <motion.div
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <BookOpen className="h-8 w-8 text-white" />
          </motion.div>
        </div>

        <div className="absolute bottom-32 left-32">
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 3, 0]
            }}
            transition={{ 
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
            className="w-18 h-18 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <Award className="h-9 w-9 text-white" />
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center mb-8">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Riven</h1>
                <p className="text-blue-100 text-sm">Learning Management System</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Begin Your Journey in 
              <span className="block text-yellow-300 flex items-center">
                Modern Education
                <Sparkles className="h-8 w-8 ml-2" />
              </span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Join thousands of educators and students who are transforming 
              the way they teach and learn with our innovative platform.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{benefit.title}</h3>
                      <p className="text-blue-100 text-sm">{benefit.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}