'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, MessageSquare, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Riven</h1>
            </div>
            <div className="space-x-4">
              <Button variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Modern Learning Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Riven is a comprehensive LMS designed for schools to manage courses, 
            students, teachers, and enhance the learning experience with modern tools.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: BookOpen,
              title: "Course Management",
              description: "Create and manage courses with lessons, assignments, and quizzes"
            },
            {
              icon: Users,
              title: "User Management",
              description: "Manage students, teachers, and administrators with role-based access"
            },
            {
              icon: MessageSquare,
              title: "Real-time Messaging",
              description: "Communicate instantly with built-in messaging and blackboard tools"
            },
            {
              icon: BarChart3,
              title: "Analytics & Reports",
              description: "Track progress and performance with detailed analytics"
            }
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center">
                <CardHeader>
                  <Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTA Section */}
        <Card className="bg-blue-600 text-white">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Join thousands of schools already using Riven to enhance their learning experience
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Create Your School Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Riven</span>
            </div>
            <p className="text-gray-500">&copy; 2025 Riven. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
