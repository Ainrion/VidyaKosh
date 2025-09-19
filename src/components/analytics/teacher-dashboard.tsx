'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Clock,
  Award,
  MessageSquare,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Calendar,
  Target
} from 'lucide-react'

interface TeacherDashboardProps {
  userId: string
  institutionId: string
}

interface ClassStats {
  total_students: number
  active_students: number
  average_grade: number
  completion_rate: number
  total_assignments: number
  pending_grades: number
}

interface CourseOverview {
  course_id: string
  course_title: string
  enrolled_students: number
  completion_rate: number
  average_grade: number
  total_lessons: number
  published_lessons: number
}

interface StudentPerformance {
  student_id: string
  student_name: string
  course_title: string
  completion_percentage: number
  average_grade: number
  last_activity: string
  needs_attention: boolean
}

interface RecentActivity {
  id: string
  type: 'assignment_submitted' | 'question_asked' | 'grade_posted' | 'announcement'
  title: string
  student_name?: string
  course_title: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
}

export function TeacherDashboard({ userId, institutionId }: TeacherDashboardProps) {
  const [classStats, setClassStats] = useState<ClassStats | null>(null)
  const [courseOverview, setCourseOverview] = useState<CourseOverview[]>([])
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demonstration
    const mockClassStats: ClassStats = {
      total_students: 45,
      active_students: 42,
      average_grade: 84.2,
      completion_rate: 78.5,
      total_assignments: 12,
      pending_grades: 8
    }

    const mockCourseOverview: CourseOverview[] = [
      {
        course_id: '1',
        course_title: 'Mathematics 101',
        enrolled_students: 25,
        completion_rate: 85,
        average_grade: 87.3,
        total_lessons: 20,
        published_lessons: 18
      },
      {
        course_id: '2',
        course_title: 'Physics Fundamentals',
        enrolled_students: 20,
        completion_rate: 72,
        average_grade: 81.5,
        total_lessons: 15,
        published_lessons: 15
      }
    ]

    const mockStudentPerformance: StudentPerformance[] = [
      {
        student_id: '1',
        student_name: 'John Doe',
        course_title: 'Mathematics 101',
        completion_percentage: 45,
        average_grade: 65,
        last_activity: new Date(Date.now() - 172800000).toISOString(),
        needs_attention: true
      },
      {
        student_id: '2',
        student_name: 'Jane Smith',
        course_title: 'Mathematics 101',
        completion_percentage: 95,
        average_grade: 92,
        last_activity: new Date(Date.now() - 3600000).toISOString(),
        needs_attention: false
      },
      {
        student_id: '3',
        student_name: 'Mike Johnson',
        course_title: 'Physics Fundamentals',
        completion_percentage: 30,
        average_grade: 58,
        last_activity: new Date(Date.now() - 259200000).toISOString(),
        needs_attention: true
      }
    ]

    const mockRecentActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'assignment_submitted',
        title: 'Calculus Assignment 3',
        student_name: 'John Doe',
        course_title: 'Mathematics 101',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        priority: 'medium'
      },
      {
        id: '2',
        type: 'question_asked',
        title: 'Question about Physics Lab',
        student_name: 'Sarah Wilson',
        course_title: 'Physics Fundamentals',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        priority: 'high'
      },
      {
        id: '3',
        type: 'grade_posted',
        title: 'Quiz Results Published',
        course_title: 'Mathematics 101',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        priority: 'low'
      }
    ]

    setClassStats(mockClassStats)
    setCourseOverview(mockCourseOverview)
    setStudentPerformance(mockStudentPerformance)
    setRecentActivity(mockRecentActivity)
    setLoading(false)
  }, [userId, institutionId])

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
      case 'assignment_submitted':
        return <FileText className="h-4 w-4" />
      case 'question_asked':
        return <MessageSquare className="h-4 w-4" />
      case 'grade_posted':
        return <Award className="h-4 w-4" />
      case 'announcement':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      {/* Class Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">{classStats?.total_students}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              {classStats?.active_students} active
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold">{classStats?.average_grade}%</p>
            </div>
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Average grade
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold">{classStats?.completion_rate}%</p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Completion rate
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Grades</p>
              <p className="text-2xl font-bold">{classStats?.pending_grades}</p>
            </div>
            <FileText className="h-8 w-8 text-red-500" />
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Pending grades
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Course Overview</h2>
            <Button variant="outline" size="sm">
              Manage Courses
            </Button>
          </div>
          
          <div className="space-y-4">
            {courseOverview.map((course) => (
              <div key={course.course_id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{course.course_title}</h3>
                  <Badge variant="outline">
                    {course.enrolled_students} students
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completion Rate</span>
                    <span>{course.completion_rate}%</span>
                  </div>
                  <Progress value={course.completion_rate} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Avg Grade: <span className={getGradeColor(course.average_grade)}>
                      {course.average_grade}%
                    </span>
                  </span>
                  <span>
                    {course.published_lessons}/{course.total_lessons} lessons
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
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <Badge className={getPriorityColor(activity.priority)}>
                      {activity.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-1">
                    {activity.course_title}
                    {activity.student_name && ` • ${activity.student_name}`}
                  </p>
                  
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Student Performance */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Student Performance</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {studentPerformance.map((student) => (
            <div key={student.student_id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {student.needs_attention ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium">{student.student_name}</h3>
                  <p className="text-sm text-gray-500">{student.course_title}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="font-medium">{student.completion_percentage}%</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className={`font-medium ${getGradeColor(student.average_grade)}`}>
                    {student.average_grade}%
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500">Last Activity</p>
                  <p className="font-medium text-xs">
                    {formatTimestamp(student.last_activity)}
                  </p>
                </div>
                
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-sm">Grade Assignments</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-sm">Create Content</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <MessageSquare className="h-6 w-6" />
            <span className="text-sm">Send Announcement</span>
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
