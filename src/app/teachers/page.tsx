'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  Search, 
  Building2, 
  Users, 
  BookOpen, 
  MessageSquare, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Heart
} from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function TeachersPage() {
  const router = useRouter()
  const [showSchoolCodeModal, setShowSchoolCodeModal] = useState(false)
  const [schoolCode, setSchoolCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schoolInfo, setSchoolInfo] = useState<{name: string, address: string} | null>(null)
  const [modalMode, setModalMode] = useState<'apply' | 'invite'>('apply')

  const handleInvitedTeacher = () => {
    // Show school code input modal for invitation flow
    setModalMode('invite')
    setShowSchoolCodeModal(true)
  }

  const handleApplyToSchool = () => {
    // Show school code input modal for application flow
    setModalMode('apply')
    setShowSchoolCodeModal(true)
  }

  const handleAdminSignup = () => {
    // Redirect to admin signup
    router.push('/signup?role=admin')
  }

  const handleSchoolCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate school code
      const response = await fetch('/api/schools/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolCode: schoolCode.toUpperCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid school code')
      }

      setSchoolInfo(data.school)
    } catch (err: any) {
      setError(err.message || 'Failed to validate school code')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyWithCode = () => {
    if (modalMode === 'invite') {
      // Redirect to teacher join page for invitation flow
      router.push(`/teachers/join?code=${schoolCode}`)
    } else {
      // Redirect to teacher application form for application flow
      router.push(`/teachers/apply?code=${schoolCode}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
              <Link href="/students" className="text-gray-600 hover:text-gray-900">
                Join as Student
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Join as a <span className="text-blue-600">Teacher</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Empower your students with Riven's comprehensive learning management system. 
              Create engaging courses, manage assignments, and collaborate in real-time.
            </p>
          </motion.div>
        </div>

        {/* Join Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">I was invited</CardTitle>
                <CardDescription>
                  You received an invitation from a school administrator
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={handleInvitedTeacher}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Join with Invitation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">I want to apply</CardTitle>
                <CardDescription>
                  Find and apply to schools that are looking for teachers
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={handleApplyToSchool}
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                >
                  Browse Schools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">I'm an admin</CardTitle>
                <CardDescription>
                  Set up a new school and manage your educational institution
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={handleAdminSignup}
                  variant="outline"
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  Create School
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Riven?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to create engaging learning experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Course Management</h3>
              <p className="text-sm text-gray-600">
                Create and organize courses with ease. Upload materials, create lessons, and track progress.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Student Engagement</h3>
              <p className="text-sm text-gray-600">
                Interactive tools to keep students engaged. Real-time collaboration and feedback.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Communication</h3>
              <p className="text-sm text-gray-600">
                Built-in messaging and announcement system. Stay connected with your students.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Assessment Tools</h3>
              <p className="text-sm text-gray-600">
                Create assignments, quizzes, and track student performance with detailed analytics.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Secure & Reliable</h3>
            </div>
            <p className="text-sm text-gray-600">
              Enterprise-grade security with data encryption and secure authentication.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Zap className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Real-time Collaboration</h3>
            </div>
            <p className="text-sm text-gray-600">
              Interactive blackboards and real-time messaging for seamless collaboration.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Student-Focused</h3>
            </div>
            <p className="text-sm text-gray-600">
              Designed with students in mind. Intuitive interface that enhances learning.
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Education?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teachers who are already using Riven to create amazing learning experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleInvitedTeacher}
              variant="secondary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Mail className="mr-2 h-5 w-5" />
              Join with Invitation
            </Button>
            <Button 
              onClick={handleApplyToSchool}
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Search className="mr-2 h-5 w-5" />
              Browse Schools
            </Button>
          </div>
        </motion.div>
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
              Empowering educators and students with modern learning tools.
            </p>
            <div className="flex justify-center space-x-6">
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

      {/* School Code Modal */}
      <Dialog open={showSchoolCodeModal} onOpenChange={setShowSchoolCodeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'invite' ? 'Join with Invitation' : 'Apply to School'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'invite' 
                ? 'Enter the school code provided by the school administrator to join the school.'
                : 'Enter the school code provided by the school administrator to apply as a teacher.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSchoolCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolCode">School Code</Label>
              <Input
                id="schoolCode"
                type="text"
                placeholder="Enter school code (e.g., ABC12345)"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                className="uppercase"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {schoolInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium text-green-800">{schoolInfo.name}</div>
                    <div className="text-sm text-green-600">{schoolInfo.address}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSchoolCodeModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              {schoolInfo ? (
                <Button
                  type="button"
                  onClick={handleApplyWithCode}
                  className="flex-1"
                >
                  {modalMode === 'invite' ? 'Join School' : 'Apply to School'}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !schoolCode}
                  className="flex-1"
                >
                  {loading ? 'Validating...' : 'Validate Code'}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
