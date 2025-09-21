'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/lib/auth-providers'
import { toast } from 'sonner'
import { toastMessages } from '@/lib/toast'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface LoginFormProps {
  onSwitchToSignup?: () => void
  onSwitchToForgotPassword?: () => void
}

export function LoginForm({ onSwitchToSignup, onSwitchToForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await authService.signInWithEmail(email, password)
      
      if (error) {
        toastMessages.auth.loginError(error.message)
        return
      }

      toastMessages.auth.loginSuccess()
      router.push('/dashboard')
    } catch (error) {
      toastMessages.auth.loginError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <Label htmlFor="remember" className="text-sm text-gray-700">
              Remember for 30 days
            </Label>
          </div>
          <Button
            type="button"
            variant="link"
            className="px-0 text-sm text-purple-600 hover:text-purple-700"
            onClick={onSwitchToForgotPassword}
          >
            Forgot password?
          </Button>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium" 
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>


      {/* Sign Up Link */}
      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Button
          variant="link"
          className="px-0 text-sm text-purple-600 hover:text-purple-700"
          onClick={onSwitchToSignup}
        >
          Sign up
        </Button>
      </div>
    </div>
  )
}
