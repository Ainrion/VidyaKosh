'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
// DashboardLayout is now handled globally in AppLayout
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Building2, 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Calendar,
  Shield,
  CheckCircle,
  BarChart3,
  Settings,
  UserPlus,
  Mail,
  Copy
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { toast } from 'sonner'

type School = Database['public']['Tables']['schools']['Row']

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalAdmins: number
  totalCourses: number
  activeCourses: number
  totalAssignments: number
  recentEnrollments: number
  averageGrade: number
}

interface RecentActivity {
  id: string
  type: 'user_created' | 'course_created' | 'assignment_created' | 'enrollment'
  title: string
  description: string
  timestamp: string
  user_name?: string
}

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [school, setSchool] = useState<School | null>(null)
  const [stats, setStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalAssignments: 0,
    recentEnrollments: 0,
    averageGrade: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showTeacherInvite, setShowTeacherInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    message: ''
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const supabase = createClient()

  const fetchSchoolData = useCallback(async () => {
    if (!profile?.school_id) return

    try {
      // Fetch school information using the API endpoint to ensure school_code is included
      const response = await fetch('/api/schools/info')
      if (response.ok) {
        const data = await response.json()
        setSchool(data.school)
      } else {
        // Fallback to direct Supabase query if API fails
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .single()

        if (schoolError) throw schoolError
        setSchool(schoolData)
      }

      // Fetch statistics
      const [
        studentsResult,
        teachersResult,
        adminsResult,
        coursesResult,
        activeCoursesResult,
        assignmentsResult,
        enrollmentsResult
      ] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id)
          .eq('role', 'student')
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id)
          .eq('role', 'teacher')
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id)
          .eq('role', 'admin')
          .eq('is_active', true),
        supabase
          .from('courses')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id),
        supabase
          .from('courses')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id)
          .eq('archived', false),
        supabase
          .from('assignments')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id),
        supabase
          .from('enrollments')
          .select('id', { count: 'exact' })
          .gte('enrolled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ])

      // Extract counts safely
      const studentsCount = studentsResult.status === 'fulfilled' ? studentsResult.value.count || 0 : 0
      const teachersCount = teachersResult.status === 'fulfilled' ? teachersResult.value.count || 0 : 0
      const adminsCount = adminsResult.status === 'fulfilled' ? adminsResult.value.count || 0 : 0
      const coursesCount = coursesResult.status === 'fulfilled' ? coursesResult.value.count || 0 : 0
      const activeCoursesCount = activeCoursesResult.status === 'fulfilled' ? activeCoursesResult.value.count || 0 : 0
      const assignmentsCount = assignmentsResult.status === 'fulfilled' ? assignmentsResult.value.count || 0 : 0
      const enrollmentsCount = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value.count || 0 : 0

      setStats({
        totalStudents: studentsCount,
        totalTeachers: teachersCount,
        totalAdmins: adminsCount,
        totalCourses: coursesCount,
        activeCourses: activeCoursesCount,
        totalAssignments: assignmentsCount,
        recentEnrollments: enrollmentsCount,
        averageGrade: 85.2 // Mock data - would be calculated from actual grades
      })

      // Mock recent activity data
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'user_created',
          title: 'New Student Enrolled',
          description: 'John Doe joined Mathematics 101',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user_name: 'John Doe'
        },
        {
          id: '2',
          type: 'course_created',
          title: 'New Course Created',
          description: 'Physics Fundamentals course published',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '3',
          type: 'assignment_created',
          title: 'Assignment Posted',
          description: 'Math homework assigned to 25 students',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      setRecentActivity(mockActivity)

    } catch (error) {
      console.error('Error fetching school data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, supabase])

  useEffect(() => {
    if (profile?.role === 'admin' && profile.school_id) {
      fetchSchoolData()
    }
  }, [profile, fetchSchoolData])

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_user':
        router.push('/users')
        break
      case 'invite_teacher':
        setShowTeacherInvite(true)
        break
      case 'create_course':
        router.push('/courses')
        break
      case 'manage_assignments':
        router.push('/assignments')
        break
      case 'view_reports':
        router.push('/reports')
        break
      case 'school_settings':
        router.push('/settings')
        break
      case 'quiz_builder':
        router.push('/quiz-builder')
        break
      case 'exam_management':
        router.push('/exams')
        break
      case 'calendar':
        router.push('/calendar')
        break
      default:
        console.log('Unknown action:', action)
    }
  }

  const handleTeacherInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const response = await fetch('/api/invitations/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inviteForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setInviteSuccess(`Teacher invitation sent successfully! Invite URL: ${data.invitation.inviteUrl}`)
      setInviteForm({ email: '', message: '' })
      
      // Refresh stats to show updated numbers
      fetchSchoolData()
      
    } catch (error) {
      console.error('Error sending teacher invitation:', error)
      setInviteError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const resetInviteModal = () => {
    setShowTeacherInvite(false)
    setInviteForm({ email: '', message: '' })
    setInviteError('')
    setInviteSuccess('')
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can access this page.</p>
          </div>
        </div>    )
  }

  if (loading) {
    return (
      <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'course_created':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'assignment_created':
        return <FileText className="h-4 w-4 text-purple-500" />
      case 'enrollment':
        return <BookOpen className="h-4 w-4 text-orange-500" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">School Administration</h1>
            <p className="text-gray-600 mt-1">
              Manage {school?.name || 'your school'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              School Data
            </Badge>
          </div>
        </div>

        {/* School Information */}
        {school && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                School Information
              </CardTitle>
              <CardDescription>
                Basic information about your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{school.name}</h3>
                  
                  <div className="space-y-3 text-sm text-gray-600">
                    {school.school_code && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-blue-900 mb-1">School Code</p>
                            <p className="text-2xl font-bold text-blue-800 font-mono">{school.school_code}</p>
                            <p className="text-xs text-blue-600 mt-1">Share this code with teachers</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-100"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(school.school_code!)
                                toast.success('School code copied to clipboard!')
                              } catch (error) {
                                console.error('Failed to copy school code:', error)
                                toast.error('Failed to copy school code')
                              }
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}
                    {school.address && (
                      <p><strong>Address:</strong> {school.address}</p>
                    )}
                    {school.phone && (
                      <p><strong>Phone:</strong> {school.phone}</p>
                    )}
                    {school.email && (
                      <p><strong>Email:</strong> {school.email}</p>
                    )}
                    <p><strong>Created:</strong> {new Date(school.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Image 
                      src="/logo.png" 
                      alt="Riven Logo" 
                      width={96} 
                      height={96}
                      className="h-24 w-24"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-gray-500">Active students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-gray-500">Active teachers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-gray-500">{stats.activeCourses} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Enrollments</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentEnrollments}</div>
              <p className="text-xs text-gray-500">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest activities in your school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('add_user')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-emerald-50 hover:border-emerald-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('invite_teacher')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Teacher
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-green-50 hover:border-green-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('create_course')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-purple-50 hover:border-purple-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('quiz_builder')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Quiz Builder
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-orange-50 hover:border-orange-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('exam_management')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Exams
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-indigo-50 hover:border-indigo-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('manage_assignments')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Assignments
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-cyan-50 hover:border-cyan-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('calendar')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-pink-50 hover:border-pink-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('view_reports')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button 
                  className="w-full justify-start hover:bg-gray-50 hover:border-gray-200 transition-colors" 
                  variant="outline"
                  onClick={() => handleQuickAction('school_settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  School Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Isolation Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800">School Data Access</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Dashboard displays data for {school?.name || 'your school'} only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Invitation Modal */}
        <Dialog open={showTeacherInvite} onOpenChange={resetInviteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" />
                Invite Teacher
              </DialogTitle>
              <DialogDescription>
                Send an invitation to a teacher to join {school?.name || 'your school'}.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleTeacherInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-email">Teacher Email</Label>
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder="teacher@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={inviteLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                <Textarea
                  id="invite-message"
                  placeholder="Add a personal message to your invitation..."
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  disabled={inviteLoading}
                  rows={3}
                />
              </div>

              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                  {inviteSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={inviteLoading || !inviteForm.email}
                  className="flex-1"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetInviteModal}
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>  )
}
