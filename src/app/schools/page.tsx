'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  Users, 
  BookOpen,
  ArrowRight,
  Building2,
  Send,
  CheckCircle
} from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface School {
  id: string
  name: string
  address: string
  email: string
  phone: string
  logo_url?: string
  created_at: string
  _count?: {
    courses: number
    profiles: number
  }
}

interface ApplicationFormData {
  teacherName: string
  teacherEmail: string
  message: string
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [applicationForm, setApplicationForm] = useState<ApplicationFormData>({
    teacherName: '',
    teacherEmail: '',
    message: ''
  })
  const [submittingApplication, setSubmittingApplication] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [applicationError, setApplicationError] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools')
      if (response.ok) {
        const data = await response.json()
        setSchools(data.schools || [])
      } else {
        console.error('Failed to fetch schools')
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchool) return

    setSubmittingApplication(true)
    setApplicationError('')

    try {
      const response = await fetch('/api/teachers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherName: applicationForm.teacherName,
          teacherEmail: applicationForm.teacherEmail,
          schoolId: selectedSchool.id,
          message: applicationForm.message
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setApplicationSubmitted(true)
      setApplicationForm({
        teacherName: '',
        teacherEmail: '',
        message: ''
      })
    } catch (error: any) {
      console.error('Application submission error:', error)
      setApplicationError(error.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmittingApplication(false)
    }
  }

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                Back to Teachers
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Find Your School
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Browse schools that are looking for teachers and apply to join their team.
            </p>
          </motion.div>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search schools by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSchools.map((school, index) => (
              <motion.div
                key={school.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        {school.logo_url ? (
                          <img 
                            src={school.logo_url} 
                            alt={school.name}
                            className="w-12 h-12 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{school.name}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {school.address}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {school.email}
                      </div>
                      {school.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {school.phone}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-gray-600">
                          {school._count?.profiles || 0} members
                        </span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-gray-600">
                          {school._count?.courses || 0} courses
                        </span>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => setSelectedSchool(school)}
                        >
                          Apply to Join
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Apply to {school.name}</DialogTitle>
                          <DialogDescription>
                            Send an application to join this school as a teacher.
                          </DialogDescription>
                        </DialogHeader>
                        
                        {applicationSubmitted ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Application Submitted!
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Your application has been sent to {school.name}. 
                              They will review it and get back to you soon.
                            </p>
                            <Button 
                              onClick={() => {
                                setApplicationSubmitted(false)
                                setSelectedSchool(null)
                              }}
                              variant="outline"
                            >
                              Close
                            </Button>
                          </div>
                        ) : (
                          <form onSubmit={handleApplicationSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="teacherName">Your Name</Label>
                              <Input
                                id="teacherName"
                                value={applicationForm.teacherName}
                                onChange={(e) => setApplicationForm(prev => ({ 
                                  ...prev, 
                                  teacherName: e.target.value 
                                }))}
                                placeholder="Enter your full name"
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="teacherEmail">Email Address</Label>
                              <Input
                                id="teacherEmail"
                                type="email"
                                value={applicationForm.teacherEmail}
                                onChange={(e) => setApplicationForm(prev => ({ 
                                  ...prev, 
                                  teacherEmail: e.target.value 
                                }))}
                                placeholder="Enter your email"
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="message">Message (Optional)</Label>
                              <Textarea
                                id="message"
                                value={applicationForm.message}
                                onChange={(e) => setApplicationForm(prev => ({ 
                                  ...prev, 
                                  message: e.target.value 
                                }))}
                                placeholder="Tell them why you'd like to join their school..."
                                rows={3}
                              />
                            </div>

                            {applicationError && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{applicationError}</p>
                              </div>
                            )}

                            <div className="flex gap-3">
                              <Button 
                                type="submit" 
                                disabled={submittingApplication}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                {submittingApplication ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit Application
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredSchools.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No schools found' : 'No schools available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `No schools match your search for "${searchTerm}".`
                : 'There are currently no schools accepting teacher applications.'
              }
            </p>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')}
                variant="outline"
              >
                Clear Search
              </Button>
            )}
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Don't See Your School?
          </h2>
          <p className="text-gray-600 mb-6">
            If you don't see your school listed, you can still apply to join as a teacher.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => router.push('/teachers')}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to Teacher Options
            </Button>
            <Button 
              onClick={() => router.push('/signup?role=admin')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Create New School
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}