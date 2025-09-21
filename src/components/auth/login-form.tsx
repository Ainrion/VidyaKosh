'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { authService } from '@/lib/auth-providers'
import { toast } from 'sonner'
import { toastMessages } from '@/lib/toast'
import { Eye, EyeOff, Mail, Lock, Chrome, Github, Building2 } from 'lucide-react'

interface LoginFormProps {
  onSwitchToSignup?: () => void
  onSwitchToForgotPassword?: () => void
}

export function LoginForm({ onSwitchToSignup, onSwitchToForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
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

  const handleOAuthLogin = async (provider: string) => {
    setOauthLoading(provider)
    try {
      let result
      
      switch (provider) {
        case 'google':
          result = await authService.signInWithGoogle()
          break
        case 'microsoft':
          result = await authService.signInWithMicrosoft()
          break
        case 'github':
          result = await authService.signInWithGitHub()
          break
        default:
          throw new Error('Unsupported provider')
      }

      if (result.error) {
        toast.error(result.error.message)
      }
      // OAuth redirects automatically, so no need to handle success
    } catch (error) {
      toast.error('OAuth login failed')
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your Riven account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OAuth Providers */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin('google')}
            disabled={oauthLoading === 'google'}
          >
            <Chrome className="h-4 w-4 mr-2" />
            {oauthLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin('microsoft')}
            disabled={oauthLoading === 'microsoft'}
          >
            <Building2 className="h-4 w-4 mr-2" />
            {oauthLoading === 'microsoft' ? 'Signing in...' : 'Continue with Microsoft'}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin('github')}
            disabled={oauthLoading === 'github'}
          >
            <Github className="h-4 w-4 mr-2" />
            {oauthLoading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
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
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="link"
              className="px-0 text-sm"
              onClick={onSwitchToForgotPassword}
            >
              Forgot password?
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="text-center text-sm">
          Don't have an account?{' '}
          <Button
            variant="link"
            className="px-0"
            onClick={onSwitchToSignup}
          >
            Sign up
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
