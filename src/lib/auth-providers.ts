import { createClient } from '@/lib/supabase/client'

export interface AuthProvider {
  name: string
  icon: string
  color: string
  enabled: boolean
}

export const authProviders: AuthProvider[] = [
  {
    name: 'Google',
    icon: 'google',
    color: '#4285F4',
    enabled: true
  },
  {
    name: 'Microsoft',
    icon: 'microsoft',
    color: '#00BCF2',
    enabled: true
  },
  {
    name: 'GitHub',
    icon: 'github',
    color: '#333333',
    enabled: true
  },
  {
    name: 'Email',
    icon: 'mail',
    color: '#6B7280',
    enabled: true
  }
]

export class AuthService {
  private supabase = createClient()

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  async signInWithMicrosoft() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  async signInWithGitHub() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  async signUpWithEmail(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    return { data, error }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    return { error }
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { data, error }
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    return { user, error }
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession()
    return { session, error }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
