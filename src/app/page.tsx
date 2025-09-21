'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  BarChart3, 
  ArrowRight, 
  Award, 
  Shield, 
  Zap,
  CheckCircle,
  Star,
  School,
  Mail,
  PlayCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Simplified animation variants for better performance
const fadeIn = {
  initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

// School Registration Form Component
const SchoolRegistrationForm = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({
    schoolName: '',
    adminName: '',
    adminEmail: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    // Validate required fields
    if (!formData.schoolName.trim()) {
      setError('School name is required')
      return
    }
    
    if (!formData.adminEmail.trim()) {
      setError('Admin email is required')
      return
    }
    
    if (!formData.adminName.trim()) {
      setError('Admin name is required')
      return
    }
    
    if (!formData.password.trim()) {
      setError('Password is required')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      // First create the school using public API
      const schoolData = {
        name: formData.schoolName,
        address: formData.address,
        phone: formData.phone,
        email: formData.adminEmail
      }
      
      console.log('Creating school with data:', schoolData)
      
      const schoolResponse = await fetch('/api/schools/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData)
      })
      
      console.log('School response status:', schoolResponse.status)
      console.log('School response headers:', Object.fromEntries(schoolResponse.headers.entries()))

      const schoolResponseData = await schoolResponse.json()
      console.log('School response data:', schoolResponseData)

      if (!schoolResponse.ok) {
        console.error('School creation failed:', schoolResponseData)
        const errorMessage = schoolResponseData.error || schoolResponseData.details || 'Failed to create school'
        
        // Handle specific error cases
        if (errorMessage.includes('already exists')) {
          const detailsMessage = schoolResponseData.details || 'Please try with a different name or email.'
          setError(`${errorMessage}. ${detailsMessage}`)
        } else {
          setError(`School creation failed: ${errorMessage}`)
        }
        return
      }

      // Then signup the admin user
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.password,
          fullName: formData.adminName,
          role: 'admin',
          schoolName: formData.schoolName,
          schoolId: schoolResponseData.school.id
        })
      })

      const signupData = await signupResponse.json()

      if (!signupResponse.ok) {
        console.error('Signup failed:', signupData)
        throw new Error(signupData.error || signupData.details || 'Signup failed')
      }

      // Success - redirect to login with success message
      router.push('/login?message=' + encodeURIComponent('Registration successful! Please check your email to verify your account and complete the setup.'))
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Register Your School</h2>
              <p className="text-gray-600">Start your educational transformation today</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name <span className="text-red-500">*</span></Label>
              <Input
                id="schoolName"
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                placeholder="Enter your school name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminName">Administrator Name <span className="text-red-500">*</span></Label>
              <Input
                id="adminName"
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                placeholder="Enter admin full name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Administrator Email <span className="text-red-500">*</span></Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                placeholder="admin@yourschool.edu"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">School Address</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your school address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a strong password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating School...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <School className="h-4 w-4" />
                  <span>Register School</span>
                </div>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showRegistration, setShowRegistration] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Riven...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Create, organize, and deliver engaging courses with multimedia content and interactive assessments.'
    },
    {
      icon: Users,
      title: 'Student Engagement',
      description: 'Foster collaboration with discussion forums, group projects, and peer-to-peer learning.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track student progress with detailed analytics and generate comprehensive performance reports.'
    },
    {
      icon: MessageSquare,
      title: 'Real-time Communication',
      description: 'Connect instantly with built-in messaging, video calls, and live classroom sessions.'
    },
    {
      icon: Award,
      title: 'Assessment Tools',
      description: 'Create quizzes, assignments, and exams with automated grading and instant feedback.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with role-based access control and data privacy compliance.'
    }
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: '49',
      period: 'month',
      description: 'Perfect for small schools getting started',
      features: [
        'Up to 100 students',
        '5 courses',
        'Basic analytics',
        'Email support',
        'Mobile app access'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '149',
      period: 'month',
      description: 'Ideal for growing educational institutions',
      features: [
        'Up to 500 students',
        'Unlimited courses',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access',
        'Integrations'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large institutions with specific needs',
      features: [
        'Unlimited students',
        'Unlimited courses',
        'Custom analytics',
        '24/7 phone support',
        'White-label solution',
        'Custom integrations',
        'Dedicated success manager'
      ],
      popular: false
    }
  ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Navigation */}
        <header className="relative z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                  <Image 
                    src="/logo.png" 
                    alt="Riven Logo" 
                    width={24} 
                    height={24}
                    className="h-8 w-8"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Riven
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  onClick={() => setShowRegistration(true)}
                >
                  <School className="h-4 w-4 mr-2" />
                  Register School
                </Button>
              </div>
            </div>
          </div>
        </header>

      {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
      <motion.div 
                className="text-center lg:text-left"
                {...fadeIn}
              >
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                  <Zap className="h-4 w-4 mr-2" />
                  Transform Education Today
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  The Future of
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Learning Management
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-8 max-w-2xl lg:max-w-none">
                  Empower your educational institution with Riven, our comprehensive SaaS LMS platform. 
                  Streamline teaching, enhance student engagement, and drive academic success.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-xl"
                    onClick={() => setShowRegistration(true)}
                  >
                    <School className="h-5 w-5 mr-2" />
                    Register Your School
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-semibold px-8 py-4 text-lg"
                    asChild
                  >
                    <Link href="/login">
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Watch Demo
                </Link>
              </Button>
                </div>

                <div className="flex items-center justify-center lg:justify-start space-x-8 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    14-day free trial
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    No credit card required
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Cancel anytime
                  </div>
                </div>
            </motion.div>
            
            <motion.div
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden max-w-4xl">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Image 
                      src="/dashboard.png" 
                      alt="Riven Dashboard Preview" 
                      width={800} 
                      height={600}
                      className="w-full h-auto rounded-lg"
                      priority
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our comprehensive platform provides all the tools and features your educational institution needs to thrive in the digital age.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the perfect plan for your institution. All plans include a 14-day free trial with no setup fees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <div
                key={index}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                    plan.popular 
                      ? 'border-blue-500 transform scale-105' 
                      : 'border-gray-200/50'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      {plan.price === 'Custom' ? (
                        <span className="text-4xl font-bold text-gray-900">Custom</span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                          <span className="text-gray-600">/{plan.period}</span>
                        </>
                      )}
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full font-semibold py-3 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                        : 'border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => setShowRegistration(true)}
                  >
                    Start Free Trial
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Institution?
            </h2>
             <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
               Join thousands of educational institutions already using Riven to deliver exceptional learning experiences.
             </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-xl"
                onClick={() => setShowRegistration(true)}
              >
                <School className="h-5 w-5 mr-2" />
                Register Your School Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-blue-600 bg-white hover:bg-gray-100 hover:text-blue-500  font-semibold px-8 py-4 text-lg"
                asChild
              >
                <Link href="/login">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Sales
                      </Link>
                    </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center">
                    <Image 
                      src="/logo.png" 
                      alt="Riven Logo" 
                      width={24} 
                      height={24}
                      className="h-8 w-8"
                    />
                  </div>
                  <span className="text-2xl font-bold">Riven</span>
                </div>
                <p className="text-gray-400 mb-6 max-w-md">
                  Empowering educational institutions with cutting-edge learning management technology. 
                  Transform your teaching and enhance student success.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Product</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Support</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Riven. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
                <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </footer>
        </div>

      {/* School Registration Modal */}
      <AnimatePresence>
        {showRegistration && (
          <SchoolRegistrationForm onClose={() => setShowRegistration(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
