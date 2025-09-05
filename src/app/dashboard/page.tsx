'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, MessageSquare, FileText, TrendingUp, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalTeachers: number
  totalMessages: number
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalMessages: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.school_id) {
        setLoading(false)
        return
      }

      try {
        // Use Promise.allSettled to handle individual failures gracefully
        const results = await Promise.allSettled([
          supabase
            .from('courses')
            .select('id', { count: 'exact' })
            .eq('school_id', profile.school_id)
            .eq('archived', false),
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
            .from('messages')
            .select('id', { count: 'exact' })
            .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ])

        // Extract successful results, use 0 for failed ones
        const coursesCount = results[0].status === 'fulfilled' ? results[0].value.count || 0 : 0
        const studentsCount = results[1].status === 'fulfilled' ? results[1].value.count || 0 : 0
        const teachersCount = results[2].status === 'fulfilled' ? results[2].value.count || 0 : 0
        const messagesCount = results[3].status === 'fulfilled' ? results[3].value.count || 0 : 0

        // Log any errors for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const tables = ['courses', 'students', 'teachers', 'messages']
            console.warn(`Failed to fetch ${tables[index]} stats:`, result.reason)
          }
        })

        setStats({
          totalCourses: coursesCount,
          totalStudents: studentsCount,
          totalTeachers: teachersCount,
          totalMessages: messagesCount
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        // Set default values on error
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          totalTeachers: 0,
          totalMessages: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [profile?.school_id])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      description: 'Currently running courses',
      color: 'text-blue-600'
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'Enrolled students',
      color: 'text-green-600'
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers,
      icon: Users,
      description: 'Active teachers',
      color: 'text-purple-600'
    },
    {
      title: 'Messages (7 days)',
      value: stats.totalMessages,
      icon: MessageSquare,
      description: 'Recent messages',
      color: 'text-orange-600'
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {profile?.full_name || profile?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to your {profile?.role || 'user'} dashboard
          </p>
          {profile && !profile.school_id && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                🏫 <strong>School Assignment Pending:</strong> You haven't been assigned to a school yet. 
                Please contact your administrator to be assigned to your school.
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-gray-500">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest activities in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Today's classes and meetings</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Pending assignments to review</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Student progress updates</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you might want to perform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile?.role === 'admin' && (
                  <>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                      + Create new course
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                      + Add new user
                    </button>
                  </>
                )}
                {profile?.role === 'teacher' && (
                  <>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                      + Create new lesson
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                      + Post new assignment
                    </button>
                  </>
                )}
                {profile?.role === 'student' && (
                  <>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                      View upcoming assignments
                    </button>
                    <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                      Check course progress
                    </button>
                  </>
                )}
                <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                  Send a message
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
