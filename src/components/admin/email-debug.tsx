'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface EmailConfig {
  success: boolean
  configuration: {
    sendgrid: boolean
    smtp: boolean
    message: string
    priority: string
  }
  environment: {
    SMTP_HOST: boolean
    SMTP_USER: boolean
    SMTP_PASS: boolean
    SMTP_PORT: string
    SMTP_FROM?: string
    SENDGRID_API_KEY: boolean
    NEXT_PUBLIC_APP_URL?: string
    NEXT_PUBLIC_SITE_URL?: string
  }
}

export default function EmailDebug() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const checkConfiguration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-email')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error checking email configuration:', error)
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail.trim()) return
    
    setTestLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Test Email from Riven',
          message: testMessage || 'This is a test email to verify your email configuration.'
        })
      })
      
      const data = await response.json()
      setTestResult({
        success: data.success,
        message: data.success ? data.message : data.error
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to send test email'
      })
    } finally {
      setTestLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="bg-green-100 text-green-800">Configured</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">Missing</Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Email Configuration Debug
          </CardTitle>
          <CardDescription>
            Check your email configuration and test email sending functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={checkConfiguration} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Email Configuration'
            )}
          </Button>
        </CardContent>
      </Card>

      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Email Providers</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      {getStatusIcon(config.configuration.smtp)}
                      <span className="ml-2">SMTP (Nodemailer)</span>
                    </span>
                    {getStatusBadge(config.configuration.smtp)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      {getStatusIcon(config.configuration.sendgrid)}
                      <span className="ml-2">SendGrid</span>
                    </span>
                    {getStatusBadge(config.configuration.sendgrid)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Environment Variables</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      {getStatusIcon(config.environment.SMTP_HOST)}
                      <span className="ml-2">SMTP_HOST</span>
                    </span>
                    {getStatusBadge(config.environment.SMTP_HOST)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      {getStatusIcon(config.environment.SMTP_USER)}
                      <span className="ml-2">SMTP_USER</span>
                    </span>
                    {getStatusBadge(config.environment.SMTP_USER)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      {getStatusIcon(config.environment.SMTP_PASS)}
                      <span className="ml-2">SMTP_PASS</span>
                    </span>
                    {getStatusBadge(config.environment.SMTP_PASS)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Configuration Status</p>
                  <p className="text-blue-700">{config.configuration.message}</p>
                  <p className="text-sm text-blue-600 mt-1">Priority: {config.configuration.priority}</p>
                </div>
              </div>
            </div>

            {config.environment.NEXT_PUBLIC_APP_URL && (
              <div className="mt-2 p-2 bg-green-50 rounded">
                <p className="text-sm text-green-700">
                  <strong>App URL:</strong> {config.environment.NEXT_PUBLIC_APP_URL}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Send a test email to verify your configuration is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-email">Email Address</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your-email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="test-message">Test Message (Optional)</Label>
            <Input
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Custom test message..."
            />
          </div>
          <Button onClick={sendTestEmail} disabled={testLoading || !testEmail.trim()}>
            {testLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Test Email'
            )}
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    testResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {testResult.success ? 'Success!' : 'Failed'}
                  </p>
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
