'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Bell,
  User,
  ClipboardList,
  Calendar,
  Building2,
  PenTool,
  GraduationCap,
  ChevronRight,
  Menu,
  X,
  Target,
  Mail,
  UserPlus,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigation = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Admin Panel', href: '/admin', icon: Building2 },
    { name: 'Student Invitations', href: '/admin/invitations', icon: Mail, description: 'Invite students to join school' },
    { name: 'Teacher Invitations', href: '/admin/teacher-invitations', icon: UserPlus, description: 'Invite teachers to join school' },
    { name: 'Course Enrollments', href: '/admin/enrollments', icon: GraduationCap, description: 'Manage student course enrollments' },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Quiz Builder', href: '/quiz-builder', icon: Target },
    { name: 'Exams', href: '/exams', icon: ClipboardList },
    { name: 'Assignments', href: '/assignments', icon: PenTool },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  teacher: [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Course Codes', href: '/teacher/enrollment-codes', icon: LinkIcon, description: 'Generate codes for course enrollment' },
    { name: 'My Courses', href: '/courses', icon: BookOpen },
    { name: 'Quiz Builder', href: '/quiz-builder', icon: Target },
    { name: 'Exams', href: '/exams', icon: ClipboardList },
    { name: 'Assignments', href: '/assignments', icon: PenTool },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Blackboard', href: '/blackboard', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
  ],
  student: [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'My Courses', href: '/courses', icon: BookOpen },
    { name: 'Join Course', href: '/enroll', icon: LinkIcon, description: 'Use code to join a course' },
    { name: 'Exams', href: '/student/exams', icon: ClipboardList },
    { name: 'Assignments', href: '/assignments', icon: FileText },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User },
  ]
}

export function Navigation() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!profile) {
    return (
      <nav className="flex h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl w-16">
        <div className="flex h-20 items-center justify-center border-b border-slate-700">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-xs">Loading...</p>
          </div>
        </div>
      </nav>
    )
  }

  const userNavigation = navigation[profile.role] || []

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <nav className={cn(
      "flex h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Header with Logo and Toggle Button */}
      <div className={cn(
        "flex h-20 items-center border-b border-slate-700",
        isCollapsed ? "justify-center px-2" : "justify-between px-6"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Riven</h1>
              <p className="text-xs text-slate-400">Learning Management</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50 p-1.5 rounded-lg transition-all duration-200 h-8 w-8"
              title="Expand sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50 p-2 rounded-lg transition-all duration-200"
            title="Collapse sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {userNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md'
              )}
              title={isCollapsed ? (item.description || item.name) : item.description}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
              )}
              
              {/* Icon with animation */}
              <div className={cn(
                'flex items-center justify-center transition-transform duration-200',
                isActive ? 'scale-110' : 'group-hover:scale-105'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              
              {/* Text - hidden when collapsed */}
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Hover arrow */}
                  {!isActive && (
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </div>

      {/* User Profile Section */}
      <div className="border-t border-slate-700 p-4 bg-slate-800/50">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-700/50 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{profile.full_name}</div>
                <div className="text-xs text-slate-400 capitalize">{profile.role}</div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await signOut()
                } catch (error) {
                  console.error('Sign out error:', error)
                }
              }}
              className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all duration-200 rounded-xl py-3"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await signOut()
                } catch (error) {
                  console.error('Sign out error:', error)
                }
              }}
              className="text-slate-300 hover:text-white hover:bg-red-500/20 transition-all duration-200 rounded-xl p-2"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
