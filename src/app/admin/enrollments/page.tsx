'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import EnrollmentManagement from '@/components/enrollment/enrollment-management'

export default function AdminEnrollmentsPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push('/login')
        return
      }
      
      if (profile.role !== 'admin' && profile.role !== 'teacher') {
        router.push('/dashboard')
        return
      }
    }
  }, [profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
    return null
  }

  return <EnrollmentManagement />
}

