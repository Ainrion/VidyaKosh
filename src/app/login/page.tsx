'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Users, Award, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(decodeURIComponent(message))
    }
  }, [searchParams])

  const features = [
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Create and manage comprehensive courses with ease'
    },
    {
      icon: Users,
      title: 'Student Engagement',
      description: 'Connect with students through interactive learning'
    },
    {
      icon: Award,
      title: 'Progress Tracking',
      description: 'Monitor student progress and achievements'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                  <Image 
                    src="/r-logo.svg" 
                    alt="Riven Logo" 
                    width={64} 
                    height={64}
                    className="h-16 w-16"
                  />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Sign in to continue your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{successMessage}</span>
                </motion.div>
              )}
              <LoginForm />
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Don&apos;t have an account?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    href="/teachers" 
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 group"
                  >
                    <span>Join as Teacher</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <Link 
                    href="/students" 
                    className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-semibold transition-colors duration-200 group"
                  >
                    <span>Join as Student</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Side - Features & Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <BookOpen className="h-10 w-10 text-white" />
          </motion.div>
        </div>
        
        <div className="absolute top-40 right-32">
          <motion.div
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <Users className="h-8 w-8 text-white" />
          </motion.div>
        </div>

        <div className="absolute bottom-32 left-32">
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 3, 0]
            }}
            transition={{ 
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
            className="w-18 h-18 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <Award className="h-9 w-9 text-white" />
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center mb-8">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <Image 
                  src="/r-logo.svg" 
                  alt="Riven Logo" 
                  width={48} 
                  height={48}
                  className="h-12 w-12"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Riven</h1>
                <p className="text-blue-100 text-sm">Learning Management System</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Transform Education with 
              <span className="block text-yellow-300 flex items-center">
                Modern Learning
                <Sparkles className="h-8 w-8 ml-2" />
              </span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Empower educators and inspire students with our comprehensive 
              learning management platform designed for the modern classroom.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-blue-100 text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}