'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle different error types
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - user needs to complete setup
          console.log('Profile not found, user needs to complete setup')
          setProfile(null)
          setProfileLoading(false)
          // Only redirect if not already on setup page
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/setup')) {
            router.push('/setup')
          }
          return 'setup_needed'
        } else if (error.message?.includes('406') || error.code === '42501') {
          // RLS policy issue or permission denied
          console.log('Profile access denied, likely RLS policy issue or user needs setup')
          setProfile(null)
          setProfileLoading(false)
          // Only redirect if not already on setup page
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/setup')) {
            router.push('/setup')
          }
          return 'setup_needed'
        } else {
          console.error('Error fetching profile:', error)
        }
        setProfile(null)
        setProfileLoading(false)
        return 'error'
      }
      setProfile(data)
      setProfileLoading(false)
      return 'success'
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      // If it's a 406 error, treat as setup needed
      if (error.message?.includes('406') || error.status === 406) {
        console.log('Treating 406 error as setup needed')
        setProfile(null)
        setProfileLoading(false)
        // Only redirect if not already on setup page
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/setup')) {
          router.push('/setup')
        }
        return 'setup_needed'
      }
      setProfile(null)
      setProfileLoading(false)
      return 'error'
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Fetch profile in parallel, don't wait for it to complete initial load
          fetchProfile(user.id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Auth error:', error)
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])  // Empty dependency array to prevent infinite re-renders

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Force redirect to login page after sign out
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      profileLoading,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
