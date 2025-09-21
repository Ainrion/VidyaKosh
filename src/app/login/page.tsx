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
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-12">
        {/* Top Logo Section */}
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
            <Image 
              src="/r-logo.svg" 
              alt="Riven Logo" 
              width={32} 
              height={32}
              className="h-6 w-6"
            />
          </div>
          <span className="text-xl font-semibold text-gray-900">Riven</span>
        </Link>

        {/* Main Login Content */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-sm"
          >
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                <p className="text-gray-600">Welcome back! Please enter your details.</p>
              </div>

              {/* Success Message */}
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{successMessage}</span>
                </motion.div>
              )}

              {/* Login Form */}
              <LoginForm />
            </div>
          </motion.div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center text-sm text-gray-500">
          © Riven 2024
        </div>
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