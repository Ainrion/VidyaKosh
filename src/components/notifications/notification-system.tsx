'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  Award, 
  MessageSquare,
  Calendar,
  FileText,
  BookOpen,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'assignment_due' | 'exam_scheduled' | 'grade_posted' | 'announcement' | 'message' | 'course_update'
  title: string
  message: string
  sender_id?: string
  sender_name?: string
  sender_avatar?: string
  course_id?: string
  course_title?: string
  created_at: string
  is_read: boolean
  is_important: boolean
  action_url?: string
  metadata?: Record<string, any>
}

interface NotificationSystemProps {
  userId: string
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationSystem({ userId, onNotificationClick }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demonstration
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'assignment_due',
        title: 'Assignment Due Tomorrow',
        message: 'Your Mathematics assignment is due tomorrow at 11:59 PM',
        course_id: 'math101',
        course_title: 'Mathematics 101',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: false,
        is_important: true,
        action_url: '/assignments/math-assignment-3'
      },
      {
        id: '2',
        type: 'grade_posted',
        title: 'Grade Posted',
        message: 'Your Physics quiz grade has been posted. You scored 18/20 points.',
        course_id: 'physics101',
        course_title: 'Physics Fundamentals',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        is_read: false,
        is_important: false,
        action_url: '/grades/physics-quiz-2'
      },
      {
        id: '3',
        type: 'announcement',
        title: 'New Course Material',
        message: 'Dr. Smith has posted new lecture notes for Chapter 5',
        sender_id: 'teacher1',
        sender_name: 'Dr. Smith',
        course_id: 'math101',
        course_title: 'Mathematics 101',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        is_read: true,
        is_important: false,
        action_url: '/courses/math101/lessons/chapter-5'
      },
      {
        id: '4',
        type: 'exam_scheduled',
        title: 'Exam Scheduled',
        message: 'Midterm exam for Computer Science has been scheduled for next Friday',
        course_id: 'cs101',
        course_title: 'Computer Science Basics',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        is_read: true,
        is_important: true,
        action_url: '/exams/cs-midterm'
      },
      {
        id: '5',
        type: 'message',
        title: 'New Message',
        message: 'You have received a new message from Dr. Johnson',
        sender_id: 'teacher2',
        sender_name: 'Dr. Johnson',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        is_read: true,
        is_important: false,
        action_url: '/messages'
      }
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.is_read).length)
    setLoading(false)
  }, [userId])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_due':
        return <FileText className="h-4 w-4" />
      case 'exam_scheduled':
        return <Calendar className="h-4 w-4" />
      case 'grade_posted':
        return <Award className="h-4 w-4" />
      case 'announcement':
        return <AlertCircle className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'course_update':
        return <BookOpen className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment_due':
        return 'text-red-500'
      case 'exam_scheduled':
        return 'text-blue-500'
      case 'grade_posted':
        return 'text-green-500'
      case 'announcement':
        return 'text-yellow-500'
      case 'message':
        return 'text-purple-500'
      case 'course_update':
        return 'text-indigo-500'
      default:
        return 'text-gray-500'
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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, is_read: true }
        : notification
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })))
    setUnreadCount(0)
    toast.success('All notifications marked as read')
  }

  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    onNotificationClick?.(notification)
    setShowDropdown(false)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading) {
    return (
      <div className="relative">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDropdown(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      !notification.is_read ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <div className={getNotificationColor(notification.type)}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          
                          {notification.course_title && (
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.course_title}
                            </p>
                          )}
                          
                          {notification.sender_name && (
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-xs">
                                  {getInitials(notification.sender_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-500">
                                {notification.sender_name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {notification.is_important && (
                            <Badge variant="destructive" className="text-xs">
                              Important
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <Button variant="outline" size="sm" className="w-full">
              View All Notifications
            </Button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
