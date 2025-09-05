'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export default function SetupPage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<any[]>([])
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'student',
    school_id: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    // Pre-fill email and name from auth user
    setFormData(prev => ({
      ...prev,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
    }))

    fetchSchools()
  }, [user, router])

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error fetching schools:', error)
      }
      
      if (!data || data.length === 0) {
        // If no schools exist, we'll create the profile without a school first
        // and let an admin assign the user to a school later
        setSchools([
          { id: 'temp-no-school', name: 'No School (Will be assigned later)' }
        ])
        setFormData(prev => ({ ...prev, school_id: 'temp-no-school' }))
      } else {
        setSchools(data)
        
        // If only one school, auto-select it
        if (data.length === 1) {
          setFormData(prev => ({ ...prev, school_id: data[0].id }))
        }
      }
    } catch (error) {
      console.error('Error in fetchSchools:', error)
      // Fallback: allow profile creation without school assignment
      setSchools([
        { id: 'temp-no-school', name: 'No School (Will be assigned later)' }
      ])
      setFormData(prev => ({ ...prev, school_id: 'temp-no-school' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.full_name.trim() || !formData.school_id) return

    setLoading(true)
    try {
      let schoolId: string | null = formData.school_id
      
      // If no real school is selected, set to null
      if (formData.school_id === 'temp-no-school') {
        schoolId = null
      }

      // Create the profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: formData.full_name.trim(),
          role: formData.role as 'student' | 'teacher' | 'admin',
          school_id: schoolId,
          is_active: true
        })

      if (error) {
        console.error('Profile creation error:', error)
        throw error
      }

      // Refresh the profile in the auth context
      await refreshProfile()
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating profile:', error)
      alert(`Error: ${error.message || 'Failed to create profile. Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Vidyakosh!</h1>
          <p className="mt-2 text-gray-600">Let's set up your profile to get started</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide the following information to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <Label htmlFor="school_id">School</Label>
                <select
                  id="school_id"
                  required
                  value={formData.school_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                {formData.school_id === 'temp-no-school' && (
                  <p className="text-sm text-amber-600 mt-1">
                    📝 You can be assigned to a school later by an administrator
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !formData.full_name.trim() || !formData.school_id}
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
