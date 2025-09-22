'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle,
  School,
  Users,
  BarChart3,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Building2,
  BookOpen,
  MessageSquare,
  Calendar,
  FileText,
  Target,
  Mail,
  Phone,
  Headphones,
  Globe,
  Settings,
  Award,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function PricingPage() {
  const schoolPlans = [
    {
      name: 'Starter',
      price: '1,00,000',
      period: 'year',
      perStudent: '₹200 per student',
      studentLimit: 'Up to 500 Students',
      description: 'Perfect for small schools getting started',
      features: [
        'Course management (upload, assignments, homework)',
        'Attendance tracking',
        'Parent login (view reports, messages)',
        'Announcements + notices',
        'Basic analytics (attendance %, grades, usage)',
        'Email support'
      ],
      popular: false,
      icon: School
    },
    {
      name: 'Growth',
      price: '1,75,000',
      period: 'year',
      perStudent: '₹175 per student',
      studentLimit: 'Up to 1000 Students',
      description: 'Ideal for growing educational institutions',
      features: [
        'Everything in Starter +',
        'Live classes (Zoom/Meet integration)',
        'Online fee collection + payment reports',
        'Report cards & automated grading',
        'Group discussions & student engagement tools',
        'Role-based staff access (teacher/admin separation)',
        'Email + chat support'
      ],
      popular: true,
      icon: TrendingUp
    },
    {
      name: 'Premium',
      price: '2,99,000',
      period: 'year',
      perStudent: '₹150 per student',
      studentLimit: 'Up to 2000 Students',
      description: 'Advanced features for established schools',
      features: [
        'Everything in Growth +',
        'Advanced analytics (performance trends, dropout prediction)',
        'Multi-branch support (manage multiple campuses)',
        'Custom branding (school logo, colors, theme)',
        'Bulk upload/import (students, courses, exams)',
        'Priority onboarding support',
        'Email + chat + phone support'
      ],
      popular: false,
      icon: Star
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      perStudent: '₹100-250 per student',
      studentLimit: '2000+ Students',
      description: 'For large institutions with specific needs',
      features: [
        'Everything in Premium +',
        'White-label mobile app (school-branded app)',
        'API integrations (HR, ERP, finance systems)',
        'Dedicated account manager',
        'Custom features on request',
        'SLA-backed uptime guarantee (99.9%)'
      ],
      popular: false,
      icon: Building2
    }
  ]

  const coachingPlans = [
    {
      name: 'Starter',
      price: '50,000',
      period: 'year',
      perStudent: '₹333 per student',
      studentLimit: 'Up to 150 Students',
      description: 'Perfect for small coaching centers',
      features: [
        'Course uploads & assignments',
        'Batch-wise attendance tracking',
        'Student portal (results, progress)',
        'Announcements & notices',
        'Basic analytics',
        'Email support'
      ],
      popular: false,
      icon: BookOpen
    },
    {
      name: 'Growth',
      price: '99,000',
      period: 'year',
      perStudent: '₹247 per student',
      studentLimit: 'Up to 400 Students',
      description: 'Ideal for growing coaching institutions',
      features: [
        'Everything in Starter +',
        'Live class integration (Zoom/Meet)',
        'Online fee management',
        'Automated test results & performance reports',
        'Batch/group chat tools',
        'Teacher & admin role separation',
        'Email + chat support'
      ],
      popular: true,
      icon: TrendingUp
    }
  ]

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <header className="relative z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <img 
                  src="/logo.png" 
                  alt="Riven Logo" 
                  className="h-8 w-8"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Riven
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/">Home</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                asChild
              >
                <Link href="/">
                  <School className="h-4 w-4 mr-2" />
                  Register School
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            {...fadeIn}
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <DollarSign className="h-4 w-4 mr-2" />
              Transparent Pricing
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Choose Your Perfect
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Learning Plan
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Competitive pricing designed for Indian educational institutions. 
              Well-positioned against market leaders like TCS iON, Teachmint, and Classplus.
            </p>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mb-12">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                No setup fees
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schools Pricing Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🏫 Schools Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Annual pricing in INR - Well positioned against TCS iON (₹1,440-3,000/student)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {schoolPlans.map((plan, index) => (
              <motion.div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  plan.popular 
                    ? 'border-blue-500 transform scale-105' 
                    : 'border-gray-200/50'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 mx-auto shadow-lg">
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    {plan.price === 'Custom' ? (
                      <span className="text-4xl font-bold text-gray-900">Custom</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                        <span className="text-gray-600">/{plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-blue-600 font-semibold mb-2">{plan.perStudent}</p>
                  <p className="text-sm text-gray-500 mb-4">{plan.studentLimit}</p>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
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
                  asChild
                >
                  <Link href="/">
                    Start Free Trial
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Centers Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🎓 Coaching Centers & Institutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Annual pricing in INR - Aggressive positioning against Classplus (₹15k-50k base)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {coachingPlans.map((plan, index) => (
              <motion.div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  plan.popular 
                    ? 'border-blue-500 transform scale-105' 
                    : 'border-gray-200/50'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center mb-4 mx-auto shadow-lg">
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-green-600 font-semibold mb-2">{plan.perStudent}</p>
                  <p className="text-sm text-gray-500 mb-4">{plan.studentLimit}</p>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full font-semibold py-3 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white' 
                      : 'border-2 border-gray-300 hover:border-green-500 hover:bg-green-50'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/">
                    Start Free Trial
                  </Link>
                </Button>
              </motion.div>
            ))}
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
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Analysis Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Market-Validated Pricing
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Based on competitive analysis of 15+ Indian LMS platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 mx-auto">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Well Positioned</h3>
              <p className="opacity-90">
                Our pricing is competitive with TCS iON, Teachmint, and other market leaders while offering superior value.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Transparent Pricing</h3>
              <p className="opacity-90">
                No hidden fees, no surprise charges. What you see is what you pay, with clear per-student pricing.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 mx-auto">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Scalable Solutions</h3>
              <p className="opacity-90">
                From small schools to large institutions, we have plans that grow with your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-slate-800 text-white">
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-xl"
              asChild
            >
              <Link href="/">
                <School className="h-5 w-5 mr-2" />
                Register Your School Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
                className="border-2 border-white text-blue-600 hover:bg-white hover:text-blue-700 font-semibold px-8 py-4 text-lg"
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
                  <img 
                    src="/logo.png" 
                    alt="Riven Logo" 
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
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
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
              © 2025 Riven. All rights reserved.
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
  )
}
