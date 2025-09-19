'use client'

// DashboardLayout is now handled globally in AppLayout
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, MessageSquare, FileText, TrendingUp, Calendar, Activity, Award, Clock, Target, ArrowUpRight, Sparkles, Plus, Eye, CheckCircle, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

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

  const enhancedStatCards = [
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      description: 'Currently running courses',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'Enrolled students',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers,
      icon: Award,
      description: 'Active teachers',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: '+3%',
      changeType: 'positive'
    },
    {
      title: 'Messages (7 days)',
      value: stats.totalMessages,
      icon: MessageSquare,
      description: 'Recent messages',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      change: '+15%',
      changeType: 'positive'
    }
  ]

  const quickActions = {
    admin: [
      {
        title: 'Manage Users',
        description: 'Add or edit user accounts',
        icon: Users,
        color: 'from-blue-50 to-indigo-50',
        hoverColor: 'hover:from-blue-100 hover:to-indigo-100',
        iconBg: 'bg-blue-100',
        iconHover: 'group-hover:bg-blue-200',
        iconColor: 'text-blue-600',
        href: '/users'
      },
      {
        title: 'Create Course',
        description: 'Set up a new course',
        icon: BookOpen,
        color: 'from-green-50 to-emerald-50',
        hoverColor: 'hover:from-green-100 hover:to-emerald-100',
        iconBg: 'bg-green-100',
        iconHover: 'group-hover:bg-green-200',
        iconColor: 'text-green-600',
        href: '/courses'
      },
      {
        title: 'View Reports',
        description: 'Check analytics and reports',
        icon: TrendingUp,
        color: 'from-purple-50 to-violet-50',
        hoverColor: 'hover:from-purple-100 hover:to-violet-100',
        iconBg: 'bg-purple-100',
        iconHover: 'group-hover:bg-purple-200',
        iconColor: 'text-purple-600',
        href: '/reports'
      }
    ],
    teacher: [
      {
        title: 'Create Course',
        description: 'Set up a new course',
        icon: BookOpen,
        color: 'from-green-50 to-emerald-50',
        hoverColor: 'hover:from-green-100 hover:to-emerald-100',
        iconBg: 'bg-green-100',
        iconHover: 'group-hover:bg-green-200',
        iconColor: 'text-green-600',
        href: '/courses'
      },
      {
        title: 'Create Assignment',
        description: 'Add a new assignment',
        icon: FileText,
        color: 'from-purple-50 to-violet-50',
        hoverColor: 'hover:from-purple-100 hover:to-violet-100',
        iconBg: 'bg-purple-100',
        iconHover: 'group-hover:bg-purple-200',
        iconColor: 'text-purple-600',
        href: '/assignments'
      },
      {
        title: 'Enrollment Codes',
        description: 'Manage course enrollment',
        icon: Target,
        color: 'from-orange-50 to-amber-50',
        hoverColor: 'hover:from-orange-100 hover:to-amber-100',
        iconBg: 'bg-orange-100',
        iconHover: 'group-hover:bg-orange-200',
        iconColor: 'text-orange-600',
        href: '/teacher/enrollment-codes'
      }
    ],
    student: [
      {
        title: 'View Courses',
        description: 'Access your enrolled courses',
        icon: BookOpen,
        color: 'from-blue-50 to-indigo-50',
        hoverColor: 'hover:from-blue-100 hover:to-indigo-100',
        iconBg: 'bg-blue-100',
        iconHover: 'group-hover:bg-blue-200',
        iconColor: 'text-blue-600',
        href: '/courses'
      },
      {
        title: 'View Assignments',
        description: 'Check pending assignments',
        icon: FileText,
        color: 'from-orange-50 to-amber-50',
        hoverColor: 'hover:from-orange-100 hover:to-amber-100',
        iconBg: 'bg-orange-100',
        iconHover: 'group-hover:bg-orange-200',
        iconColor: 'text-orange-600',
        href: '/assignments'
      },
      {
        title: 'Join Course',
        description: 'Enroll with a course code',
        icon: Plus,
        color: 'from-green-50 to-emerald-50',
        hoverColor: 'hover:from-green-100 hover:to-emerald-100',
        iconBg: 'bg-green-100',
        iconHover: 'group-hover:bg-green-200',
        iconColor: 'text-green-600',
        href: '/enroll'
      }
    ]
  }

  const recentActivities = [
    {
      title: 'Course "Introduction to Programming" created',
      time: '2 hours ago',
      color: 'bg-blue-500',
      icon: BookOpen,
      type: 'course'
    },
    {
      title: 'New student enrolled in Mathematics',
      time: '4 hours ago',
      color: 'bg-green-500',
      icon: Users,
      type: 'enrollment'
    },
    {
      title: 'Assignment submitted by John Doe',
      time: '1 day ago',
      color: 'bg-purple-500',
      icon: FileText,
      type: 'assignment'
    },
    {
      title: 'Quiz completed by 15 students',
      time: '2 days ago',
      color: 'bg-orange-500',
      icon: Target,
      type: 'quiz'
    },
    {
      title: 'New message from Sarah Wilson',
      time: '3 days ago',
      color: 'bg-pink-500',
      icon: MessageSquare,
      type: 'message'
    }
  ]

  return (
    <div className="space-y-8">
        {/* Header Section with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
              backgroundSize: '60px 60px',
              backgroundPosition: '0 0, 30px 30px'
            }}></div>
          </div>
          <div className="relative p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {getGreeting()}, {profile?.full_name || profile?.email?.split('@')[0] || 'User'}!
                    <Sparkles className="inline-block ml-2 h-8 w-8 text-yellow-300" />
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Welcome to your {profile?.role || 'user'} dashboard
                  </p>
                  {profile && !profile.school_id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-xl"
                    >
                      <p className="text-amber-100 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <strong>School Assignment Pending:</strong> You haven't been assigned to a school yet. 
                        Please contact your administrator.
                      </p>
                    </motion.div>
                  )}
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Calendar className="h-8 w-8 text-white mb-2" />
                    <p className="text-white/90 text-sm font-medium">Today</p>
                    <p className="text-white text-lg font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
        {loading ? (
                // Loading skeleton
                [1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="border-0 shadow-lg animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </CardContent>
              </Card>
                  </motion.div>
                ))
        ) : (
                enhancedStatCards.map((stat, index) => {
                  const Icon = stat.icon
              return (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                          <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                            <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                          </div>
                  </CardHeader>
                  <CardContent>
                          <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                            <div className="flex items-center space-x-1 text-sm text-green-600">
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="font-medium">{stat.change}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
                    </motion.div>
              )
                })
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>Common tasks you might want to perform</CardDescription>
            </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions[profile?.role as keyof typeof quickActions]?.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <motion.button 
                        key={action.title}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                        onClick={() => window.location.href = action.href}
                        className={`w-full text-left p-4 rounded-xl border-0 bg-gradient-to-r ${action.color} ${action.hoverColor} transition-all duration-300 group`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${action.iconBg} ${action.iconHover} transition-colors`}>
                            <Icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                          <div>
                            <div className="font-semibold text-gray-900">{action.title}</div>
                            <div className="text-sm text-gray-600">{action.description}</div>
                </div>
              </div>
                      </motion.button>
                    )
                  })}
            </CardContent>
          </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription>Latest updates and actions in your school</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => {
                      const Icon = activity.icon
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                          className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <div className={`p-2 rounded-full ${activity.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                              {activity.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.time}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        </motion.div>
                      )
                    })}
              </div>
            </CardContent>
          </Card>
            </motion.div>
          </div>
        </div>
      </div>
  )
}