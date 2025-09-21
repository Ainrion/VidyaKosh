'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react'

interface EmailConfig {
  resend: boolean
  sendgrid: boolean
  smtp: boolean
  message: string
}

export default function EmailConfigChecker() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const checkConfiguration = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-email')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.configuration)
        setTestResult(null)
      } else {
        setTestResult(`Configuration check failed: ${data.error}`)
      }
    } catch (error) {
      setTestResult(`Error checking configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      setTestResult('Please enter an email address')
      return
    }

    try {
      setSendingTest(true)
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Test Email from Riven',
          message: 'This is a test email to verify your email configuration is working correctly.'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTestResult(`✅ Test email sent successfully to ${testEmail}!`)
      } else {
        setTestResult(`❌ Failed to send test email: ${data.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Error sending test email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSendingTest(false)
    }
  }

  const getProviderStatus = (enabled: boolean) => {
    return enabled ? (
      <Badge variant="default" className="text-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Configured
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Not Configured
      </Badge>
    )
  }

  const getOverallStatus = () => {
    if (!config) return null
    
    const hasProvider = config.resend || config.sendgrid || config.smtp
    
    return hasProvider ? (
      <Badge variant="default" className="text-green-600">
        <CheckCircle className="w-4 h-4 mr-1" />
        Email Ready
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertCircle className="w-4 h-4 mr-1" />
        No Email Provider
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Check and test your email provider setup
            </CardDescription>
          </div>
          {getOverallStatus()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button onClick={checkConfiguration} disabled={loading}>
            {loading ? 'Checking...' : 'Check Configuration'}
          </Button>
        </div>

        {config && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">Resend</span>
                {getProviderStatus(config.resend)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">SendGrid</span>
                {getProviderStatus(config.sendgrid)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">SMTP</span>
                {getProviderStatus(config.smtp)}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{config.message}</p>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Send Test Email</h4>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your-email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={sendTestEmail} 
                disabled={sendingTest || !testEmail.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingTest ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
          </div>
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg ${
            testResult.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{testResult}</p>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Setup Instructions</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Resend (Recommended):</strong> Add <code>RESEND_API_KEY</code> to your environment variables</p>
            <p><strong>SendGrid:</strong> Add <code>SENDGRID_API_KEY</code> to your environment variables</p>
            <p><strong>SMTP:</strong> Add <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> to your environment variables</p>
            <p className="text-xs text-gray-500 mt-2">
              See the EMAIL_SETUP_GUIDE.md for detailed instructions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

