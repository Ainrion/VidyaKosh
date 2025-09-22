'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Building2, 
  ArrowRight,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function TeacherPendingApprovalPage() {
  const searchParams = useSearchParams()
  const schoolName = searchParams.get('school') || 'the school'
  const email = searchParams.get('email') || ''
  
  // Decode the school name in case it was URL encoded
  const decodedSchoolName = schoolName ? decodeURIComponent(schoolName) : 'the school'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Application Submitted!
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Your teacher application has been successfully submitted
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Confirmation Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Clock className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
                  <p className="text-blue-700 text-sm">
                    Your application has been submitted to <strong>{decodedSchoolName}</strong>. 
                    Once the admin accepts your application, you will be able to login into 
                    <strong> {decodedSchoolName}</strong> dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-600 mr-2" />
                <div>
                  <p className="font-medium text-gray-900">{decodedSchoolName}</p>
                  <p className="text-sm text-gray-600">School Administrator</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Button asChild className="w-full">
                <Link href="/">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Home Page
                </Link>
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500">
                You will receive an email notification once your application is reviewed.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}