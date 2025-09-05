'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, MessageSquare, BarChart3, ArrowRight, GraduationCap, Award, Clock, Target, Calculator, Globe, Atom, Microscope, PenTool, Lightbulb, Brain, Compass, Beaker, Ruler, Palette, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion'

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

const floatingAnimation = {
  y: [-10, 10, -10],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: [0.4, 0, 0.6, 1] as const
  }
}

// Educational symbols and formulas for background
const educationalElements = [
  { symbol: "∑", style: "text-6xl font-bold", position: "top-20 left-20" },
  { symbol: "π", style: "text-5xl font-bold", position: "top-40 right-32" },
  { symbol: "∫", style: "text-7xl font-bold", position: "top-60 left-1/4" },
  { symbol: "α", style: "text-4xl font-bold", position: "top-80 right-20" },
  { symbol: "β", style: "text-5xl font-bold", position: "bottom-80 left-16" },
  { symbol: "∞", style: "text-6xl font-bold", position: "bottom-60 right-1/4" },
  { symbol: "√", style: "text-5xl font-bold", position: "bottom-40 left-1/3" },
  { symbol: "Δ", style: "text-6xl font-bold", position: "bottom-20 right-16" },
  { symbol: "A", style: "text-7xl font-serif font-bold", position: "top-32 left-1/2" },
  { symbol: "B", style: "text-6xl font-serif font-bold", position: "top-96 right-1/3" },
  { symbol: "x²", style: "text-4xl font-bold", position: "top-52 right-48" },
  { symbol: "E=mc²", style: "text-3xl font-bold", position: "bottom-52 left-48" },
  { symbol: "θ", style: "text-5xl font-bold", position: "top-72 left-16" },
  { symbol: "φ", style: "text-4xl font-bold", position: "bottom-72 right-32" },
  { symbol: "∇", style: "text-5xl font-bold", position: "top-44 left-2/3" },
  { symbol: "ω", style: "text-4xl font-bold", position: "bottom-44 right-2/3" }
]

// Educational icons for animated background
const educationalIcons = [
  { Icon: Calculator, size: 32, delay: 0.1 },
  { Icon: Globe, size: 28, delay: 0.3 },
  { Icon: Atom, size: 36, delay: 0.5 },
  { Icon: Microscope, size: 30, delay: 0.7 },
  { Icon: PenTool, size: 26, delay: 0.9 },
  { Icon: Lightbulb, size: 34, delay: 1.1 },
  { Icon: Brain, size: 32, delay: 1.3 },
  { Icon: Compass, size: 28, delay: 1.5 },
  { Icon: Beaker, size: 30, delay: 1.7 },
  { Icon: Ruler, size: 26, delay: 1.9 },
  { Icon: Palette, size: 32, delay: 2.1 },
  { Icon: Star, size: 24, delay: 2.3 },
  { Icon: BookOpen, size: 30, delay: 2.5 },
  { Icon: Award, size: 28, delay: 2.7 },
  { Icon: Target, size: 32, delay: 2.9 }
]

// Typewriter Effect Component
const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }
    }, 100 + delay)

    return () => clearTimeout(timeoutId)
  }, [currentIndex, text, delay])

  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-indigo-600"
      >
        |
      </motion.span>
    </span>
  )
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollY } = useScroll()
  
  // Parallax transforms
  const y1 = useTransform(scrollY, [0, 300], [0, -50])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])
  const opacity = useTransform(scrollY, [0, 200], [1, 0.8])

  // Mouse tracking
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', updateMousePosition)
    return () => window.removeEventListener('mousemove', updateMousePosition)
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const hoverScale = {
    scale: 1.05,
    rotateY: 10,
    z: 50,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }

  const cardVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    hover: {
      y: -10,
      scale: 1.03,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: { 
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </motion.div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Mouse Follower */}
      <motion.div
        className="fixed w-6 h-6 bg-indigo-400/20 rounded-full pointer-events-none z-50 mix-blend-difference"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 200,
          restDelta: 0.001
        }}
      />

      {/* Educational Background Elements with Parallax */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ y: y1, opacity }}
      >
        {educationalElements.map((element, index) => (
          <motion.div
            key={index}
            className={`absolute ${element.position} ${element.style} text-indigo-100/30 select-none`}
            animate={{
              y: [-10, 10, -10],
            }}
            transition={{
              ...floatingAnimation.transition,
              delay: index * 0.5,
              duration: 4 + (index % 3) * 2
            }}
          >
            {element.symbol}
          </motion.div>
        ))}
        
        {/* Geometric shapes */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-indigo-200/40 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
                <motion.div
          className="absolute bottom-1/3 left-1/3 w-24 h-24 border-2 border-purple-200/40 rotate-45"
          animate={{ 
            rotate: [45, 405, 45],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated Educational Icons */}
        {educationalIcons.map((item, index) => {
          const { Icon } = item;
          return (
            <motion.div
              key={`icon-${index}`}
              className="absolute text-indigo-300/40"
              style={{
                left: `${(index * 117 + 73) % 90 + 5}%`,
                top: `${(index * 89 + 47) % 80 + 10}%`,
              }}
              animate={{
                x: [0, 20, -10, 0],
                y: [0, -15, 10, 0],
                rotate: [0, 10, -5, 0],
                scale: [1, 1.1, 0.9, 1],
              }}
              transition={{
                duration: 8 + (index % 4),
                repeat: Infinity,
                ease: [0.4, 0, 0.6, 1] as const,
                delay: item.delay
              }}
            >
              <Icon size={item.size} />
            </motion.div>
          )
        })}

        {/* Additional Floating Educational Elements */}
        <motion.div
          className="absolute top-1/6 left-1/6 text-indigo-200/30"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <GraduationCap size={40} />
        </motion.div>

        <motion.div
          className="absolute top-2/3 right-1/6 text-purple-200/30"
          animate={{
            y: [-20, 20, -20],
            rotate: [0, -10, 10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1] as const
          }}
        >
          <TrendingUp size={35} />
        </motion.div>

        <motion.div
          className="absolute bottom-1/4 left-1/2 text-indigo-200/25"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Lightbulb size={38} />
        </motion.div>

        {/* Orbiting Educational Elements */}
        <motion.div
          className="absolute top-1/3 right-1/3"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <div className="relative w-20 h-20">
            <motion.div
              className="absolute inset-0 text-blue-300/30"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Atom size={24} className="absolute top-0 left-1/2 transform -translate-x-1/2" />
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Book Animation */}
        <motion.div
          className="absolute top-1/5 right-1/5 text-purple-300/30"
          animate={{
            y: [-15, 15, -15],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1] as const
          }}
        >
          <BookOpen size={36} />
        </motion.div>

        {/* Pulsing Brain Icon */}
        <motion.div
          className="absolute bottom-1/5 right-1/4 text-indigo-300/25"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.25, 0.5, 0.25],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain size={32} />
        </motion.div>

        {/* Floating Particles */}
        {Array.from({ length: 12 }).map((_, index) => (
          <motion.div
            key={`particle-${index}`}
            className="absolute w-2 h-2 bg-indigo-300/20 rounded-full"
            style={{
              left: `${(index * 83 + 37) % 95 + 2.5}%`,
              top: `${(index * 67 + 29) % 85 + 7.5}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 6 + (index % 3),
              repeat: Infinity,
              ease: [0.4, 0, 0.6, 1] as const,
              delay: index * 0.3
            }}
          />
        ))}

        {/* Floating Bubbles */}
        {Array.from({ length: 8 }).map((_, index) => (
          <motion.div
            key={`bubble-${index}`}
            className="absolute border border-indigo-200/30 rounded-full"
            style={{
              width: `${20 + (index % 4) * 10}px`,
              height: `${20 + (index % 4) * 10}px`,
              left: `${(index * 123 + 41) % 90 + 5}%`,
              top: `${(index * 97 + 53) % 80 + 10}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + (index % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.5
            }}
          />
        ))}
      </motion.div>

      {/* Header */}
      <motion.header 
        className="relative bg-white/80 backdrop-blur-sm border-b border-indigo-100 shadow-sm"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                  boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)"
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <GraduationCap className="h-6 w-6 text-white" />
                </motion.div>
              </motion.div>
              <motion.h1 
                className="ml-3 text-2xl font-bold text-gray-900"
                whileHover={{ 
                  color: "#4F46E5",
                  textShadow: "0 0 10px rgba(79, 70, 229, 0.5)"
                }}
                transition={{ duration: 0.2 }}
              >
                Vidyakosh
              </motion.h1>
              <motion.span 
                className="ml-2 text-sm text-indigo-600 font-medium"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                LMS
              </motion.span>
            </motion.div>
            <motion.div 
              className="space-x-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -2
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="ghost" className="text-gray-700 hover:text-indigo-600" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)",
                  y: -2
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.div 
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20"
        style={{ y: y1 }}
      >
        <motion.div 
          className="text-center mb-20"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={fadeInUp}
            className="mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span 
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium"
              whileHover={{
                backgroundColor: "#4F46E5",
                color: "#FFFFFF",
                scale: 1.05
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Award className="h-4 w-4 mr-2" />
              </motion.div>
              Professional Learning Management System
            </motion.span>
          </motion.div>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900"
            whileHover={{
              scale: 1.02,
              textShadow: "0 0 20px rgba(79, 70, 229, 0.3)"
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              animate={{
                background: [
                  "linear-gradient(45deg, #1f2937, #1f2937)",
                  "linear-gradient(45deg, #4F46E5, #7C3AED)",
                  "linear-gradient(45deg, #1f2937, #1f2937)"
                ]
              }}
              style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Comprehensive School
            </motion.span>
            <br />
            <motion.span 
              className="text-indigo-600"
              animate={{
                scale: [1, 1.02, 1],
                color: ["#4F46E5", "#7C3AED", "#4F46E5"]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Learning Platform
            </motion.span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
            whileHover={{
              scale: 1.02,
              color: "#4B5563"
            }}
            transition={{ duration: 0.3 }}
          >
            <TypewriterText 
              text="Streamline your educational institution with our complete learning management system. Manage courses, track student progress, facilitate communication, and enhance the learning experience."
              delay={1000}
            />
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 15px 40px rgba(99, 102, 241, 0.3)",
                y: -3
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg shadow-lg" asChild>
                <Link href="/signup" className="flex items-center">
                  Get Started Free
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="ml-2"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{
                scale: 1.05,
                borderColor: "#4F46E5",
                backgroundColor: "rgba(99, 102, 241, 0.05)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button variant="outline" size="lg" className="border-2 px-8 py-3 text-lg" asChild>
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {[
            {
              icon: BookOpen,
              title: "Course Management",
              description: "Create comprehensive courses with structured lessons, assignments, and assessments",
              color: "indigo"
            },
            {
              icon: Users,
              title: "Student & Faculty Management",
              description: "Efficiently manage student enrollment, faculty assignments, and role-based permissions",
              color: "purple"
            },
            {
              icon: MessageSquare,
              title: "Communication Hub",
              description: "Real-time messaging, announcements, and collaborative discussion forums",
              color: "blue"
            },
            {
              icon: BarChart3,
              title: "Performance Analytics",
              description: "Detailed reports on student progress, course effectiveness, and institutional metrics",
              color: "emerald"
            }
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  rotateY: 5,
                  z: 50
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ perspective: 1000 }}
              >
                <motion.div
                  whileHover={{
                    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
                    background: "rgba(255,255,255,0.9)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full bg-white/70 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="text-center pb-4">
                      <motion.div 
                        className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-${feature.color}-100 flex items-center justify-center`}
                        whileHover={{ 
                          scale: 1.2,
                          rotate: [0, -10, 10, 0],
                          background: feature.color === 'indigo' ? '#4F46E5' : 
                                     feature.color === 'purple' ? '#7C3AED' :
                                     feature.color === 'blue' ? '#2563EB' :
                                     '#059669'
                        }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          whileHover={{ 
                            color: '#FFFFFF',
                            scale: 1.1 
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <Icon className={`h-7 w-7 text-${feature.color}-600`} />
                        </motion.div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardTitle className="text-lg font-semibold text-gray-900">{feature.title}</CardTitle>
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 text-center leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {[
            { number: "50,000+", label: "Students Enrolled", icon: Users },
            { number: "1,200+", label: "Educational Institutions", icon: GraduationCap },
            { number: "99.9%", label: "System Uptime", icon: Target },
            { number: "24/7", label: "Technical Support", icon: Clock }
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                className="text-center"
                whileHover={{ scale: 1.05 }}
                animate={{
                  y: [-5, 5, -5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1] as const,
                  delay: index * 0.2
                }}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200">
                  <Icon className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl border-0 overflow-hidden relative">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/95 to-purple-600/95"></div>
              {/* Mathematical patterns in background */}
              <div className="absolute top-4 right-4 text-white/10 text-6xl font-bold">∑</div>
              <div className="absolute bottom-4 left-4 text-white/10 text-5xl font-bold">∫</div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/5 text-8xl font-bold">π</div>
            </div>
            <CardContent className="relative text-center py-16 px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
              >
                <GraduationCap className="h-12 w-12 text-white mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Transform Your Educational Institution</h2>
                <p className="text-indigo-100 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
                  Join educational leaders worldwide who trust Vidyakosh to deliver exceptional learning experiences, 
                  improve student outcomes, and streamline institutional operations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold shadow-lg" asChild>
                      <Link href="/signup" className="flex items-center">
                        Get Started Today
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </motion.div>
                  <div className="text-indigo-100 text-sm">
                    Free setup • Professional support included
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        className="relative bg-white/80 backdrop-blur-sm border-t border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold text-gray-900">
                Vidyakosh
              </span>
              <span className="ml-2 text-sm text-indigo-600 font-medium">LMS</span>
            </div>
            <p className="text-gray-500">&copy; 2025 Vidyakosh Learning Management System. Empowering Education.</p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
