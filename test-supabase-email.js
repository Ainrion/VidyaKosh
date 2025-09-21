#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load environment variables
const envPath = '.env.local'
let envVars = {}

try {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  })
} catch (error) {
  console.error('Error reading .env.local:', error.message)
  process.exit(1)
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSupabaseEmail() {
  try {
    console.log('🧪 Testing Supabase Email Configuration...')
    
    // Get the first argument as email address
    const testEmail = process.argv[2]
    
    if (!testEmail) {
      console.log('Usage: node test-supabase-email.js <email-address>')
      console.log('Example: node test-supabase-email.js test@example.com')
      process.exit(1)
    }
    
    console.log(`📧 Testing email for: ${testEmail}`)
    
    // Try to send a password reset email (this will test email sending)
    console.log('\n1️⃣ Testing password reset email...')
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail
    })
    
    if (resetError) {
      console.error('❌ Password reset email failed:', resetError.message)
      console.log('\n💡 This suggests:')
      console.log('   - Email confirmations might be disabled')
      console.log('   - SMTP is not configured in Supabase')
      console.log('   - Email address is invalid')
    } else {
      console.log('✅ Password reset email sent successfully!')
      console.log('📧 Check your email for the reset link')
      console.log('🔗 Reset link:', resetData.properties?.action_link ? 'Generated' : 'Not generated')
    }
    
    // Try to send a signup confirmation email
    console.log('\n2️⃣ Testing signup confirmation email...')
    
    const { data: signupData, error: signupError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      password: 'test-password-123'
    })
    
    if (signupError) {
      console.error('❌ Signup confirmation email failed:', signupError.message)
      console.log('\n💡 This suggests:')
      console.log('   - Email confirmations are disabled')
      console.log('   - SMTP is not configured')
      console.log('   - User already exists')
    } else {
      console.log('✅ Signup confirmation email sent successfully!')
      console.log('📧 Check your email for the confirmation link')
      console.log('🔗 Confirmation link:', signupData.properties?.action_link ? 'Generated' : 'Not generated')
    }
    
    // Check current auth settings
    console.log('\n3️⃣ Checking current users...')
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Cannot list users:', usersError.message)
    } else {
      const user = users.users.find(u => u.email === testEmail)
      if (user) {
        console.log(`👤 User found: ${user.email}`)
        console.log(`📧 Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
        console.log(`📅 Created: ${user.created_at}`)
        console.log(`🔄 Last sign in: ${user.last_sign_in_at || 'Never'}`)
      } else {
        console.log(`👤 User not found: ${testEmail}`)
      }
    }
    
    console.log('\n🛠️ Recommendations:')
    console.log('1. Go to Supabase Dashboard → Authentication → Settings')
    console.log('2. Check if "Enable email confirmations" is ON')
    console.log('3. Configure SMTP settings if not already done')
    console.log('4. Test with a completely new email address')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSupabaseEmail()
