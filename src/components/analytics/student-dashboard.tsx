'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  BarChart3,
  FileText,
  Users,
  MessageSquare
} from 'lucide-react'

interface StudentDashboardProps {
  userId: string
  institutionId: string
}

interface CourseProgress {
  course_id: string
  course_title: string
  completion_percentage: number
  total_lessons: number
  completed_lessons: number
  last_accessed: string
  grade?: number
}

interface PerformanceStats {
  total_courses: number
  completed_courses: number
  average_score: number
  total_time_spent: number
  recent_activity: string
  current_streak: number
  total_assignments: number
  completed_assignments: number
}

interface RecentActivity {
  id: string
  type: 'lesson' | 'assignment' | 'quiz' | 'exam'
  title: string
  course_title: string
  completed_at: string
  score?: number
  max_score?: number
}

export function StudentDashboard({ userId, institutionId }: StudentDashboardProps) {
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demonstration
    const mockPerformanceStats: PerformanceStats = {
      total_courses: 8,
      completed_courses: 3,
      average_score: 87.5,
      total_time_spent: 1250, // minutes
      recent_activity: new Date(Date.now() - 3600000).toISOString(),
      current_streak: 7,
      total_assignments: 24,
      completed_assignments: 18
    }

    const mockCourseProgress: CourseProgress[] = [
      {
        course_id: '1',
        course_title: 'Mathematics 101',
        completion_percentage: 85,
        total_lessons: 20,
        completed_lessons: 17,
        last_accessed: new Date(Date.now() - 86400000).toISOString(),
        grade: 92
      },
      {
        course_id: '2',
        course_title: 'Physics Fundamentals',
        completion_percentage: 60,
        total_lessons: 15,
        completed_lessons: 9,
        last_accessed: new Date(Date.now() - 172800000).toISOString(),
        grade: 78
      },
      {
        course_id: '3',
        course_title: 'Computer Science Basics',
        completion_percentage: 100,
        total_lessons: 12,
        completed_lessons: 12,
        last_accessed: new Date(Date.now() - 259200000).toISOString(),
        grade: 95
      }
    ]

    const mockRecentActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'lesson',
        title: 'Introduction to Calculus',
        course_title: 'Mathematics 101',
        completed_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        type: 'assignment',
        title: 'Physics Lab Report',
        course_title: 'Physics Fundamentals',
        completed_at: new Date(Date.now() - 86400000).toISOString(),
        score: 85,
        max_score: 100
      },
      {
        id: '3',
        type: 'quiz',
        title: 'Programming Concepts Quiz',
        course_title: 'Computer Science Basics',
        completed_at: new Date(Date.now() - 172800000).toISOString(),
        score: 18,
        max_score: 20
      }
    ]

    setPerformanceStats(mockPerformanceStats)
    setCourseProgress(mockCourseProgress)
    setRecentActivity(mockRecentActivity)
    setLoading(false)
  }, [userId, institutionId])

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />
      case 'assignment':
        return <FileText className="h-4 w-4" />
      case 'quiz':
        return <Target className="h-4 w-4" />
      case 'exam':
        return <Award className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Courses Enrolled</p>
              <p className="text-2xl font-bold">{performanceStats?.total_courses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              {performanceStats?.completed_courses} completed
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">{performanceStats?.average_score}%</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Average score
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold">
                {performanceStats ? formatTimeSpent(performanceStats.total_time_spent) : '0h 0m'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Total time
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold">{performanceStats?.current_streak} days</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Current streak
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Course Progress</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {courseProgress.map((course) => (
              <div key={course.course_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{course.course_title}</h3>
                  <div className="flex items-center gap-2">
                    {course.grade && (
                      <span className={`text-sm font-medium ${getGradeColor(course.grade)}`}>
                        {course.grade}%
                      </span>
                    )}
                    <Badge variant="outline">
                      {course.completion_percentage}%
                    </Badge>
                  </div>
                </div>
                
                <Progress value={course.completion_percentage} className="h-2" />
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {course.completed_lessons} of {course.total_lessons} lessons
                  </span>
                  <span>
                    Last accessed {formatTimestamp(course.last_accessed)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.course_title}</p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(activity.completed_at)}
                    </span>
                    {activity.score && activity.max_score && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.score}/{activity.max_score}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-sm">Continue Learning</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-sm">View Assignments</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm">Join Discussion</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm">View Analytics</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
