'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  School,
  Building2,
  User,
  MessageSquare,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    organizationType: '',
    subject: '',
    message: '',
    inquiryType: ''
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          organizationType: '',
          subject: '',
          message: '',
          inquiryType: ''
        })
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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
                <Link href="/pricing">Pricing</Link>
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
              <MessageSquare className="h-4 w-4 mr-2" />
              Get in Touch
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Let's Transform
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Education Together
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Ready to revolutionize your educational institution? Our team is here to help you get started with Riven's comprehensive LMS platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Send us a Message</h2>
                <p className="text-gray-600">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </div>

              {status === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-green-700">Message sent successfully! We'll get back to you soon.</span>
                </div>
              )}

              {status === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-red-700">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-sm font-semibold text-gray-700">
                      Organization Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="organization"
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      placeholder="Your school/institution name"
                      required
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organizationType" className="text-sm font-semibold text-gray-700">
                      Organization Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="coaching-center">Coaching Center</SelectItem>
                        <SelectItem value="college">College/University</SelectItem>
                        <SelectItem value="training-institute">Training Institute</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inquiryType" className="text-sm font-semibold text-gray-700">
                      Inquiry Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.inquiryType} onValueChange={(value) => handleInputChange('inquiryType', value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Request Demo</SelectItem>
                        <SelectItem value="pricing">Pricing Inquiry</SelectItem>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="custom">Custom Solution</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Brief subject of your inquiry"
                    required
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Tell us more about your requirements, current challenges, or any specific questions you have..."
                    required
                    rows={6}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending Message...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>Send Message</span>
                    </div>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                <p className="text-lg text-gray-600 mb-8">
                  We're here to help you transform your educational institution. Reach out to us through any of the channels below.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
                    <p className="text-gray-600 mb-2">Send us an email anytime</p>
                    <a href="mailto:info@ainrion.com" className="text-blue-600 hover:text-blue-700 font-medium">
                    info@ainrion.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
                    <p className="text-gray-600 mb-2">Mon-Fri from 9am to 6pm IST</p>
                    <a href="tel:+917355848551" className="text-blue-600 hover:text-blue-700 font-medium">
                      +91 73558 48551
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Us</h3>
                    <p className="text-gray-600 mb-2">Our office location</p>
                    <p className="text-gray-700">
                      AINRION TECHNOLOGIES PRIVATE LIMITED<br />
                      New Delhi, Delhi<br />
                      India
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h3>
                    <p className="text-gray-600 mb-2">We're available during</p>
                    <p className="text-gray-700">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 10:00 AM - 4:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Join thousands of educational institutions already using Riven to transform their learning experience.
                </p>
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-xl"
                  asChild
                >
                  <Link href="/">
                    <School className="h-5 w-5 mr-2" />
                    Register Your School
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Quick answers to common questions about Riven's LMS platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">How quickly can we get started?</h3>
              <p className="text-gray-600">
                Most schools can be up and running within 24-48 hours. We provide priority onboarding support and can help with data migration from your existing systems.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Do you offer training for our staff?</h3>
              <p className="text-gray-600">
                Yes! We provide comprehensive training sessions for administrators, teachers, and support staff. Training is included with all plans.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Can we integrate with our existing systems?</h3>
              <p className="text-gray-600">
                Absolutely. Riven offers API integrations with most popular school management systems, payment gateways, and third-party tools.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What kind of support do you provide?</h3>
              <p className="text-gray-600">
                We offer email, chat, and phone support depending on your plan. Enterprise customers get dedicated account managers and 24/7 support.
              </p>
            </div>
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
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
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
