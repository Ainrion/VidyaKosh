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
  console.error('❌ Error reading .env.local:', error.message)
  process.exit(1)
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAdminSignup() {
  try {
    console.log('🧪 Testing Admin Signup Process...')
    console.log('')
    
    // Test data
    const testEmail = 'admin-test-' + Date.now() + '@example.com'
    const testPassword = 'AdminTest123!'
    const testName = 'Test Admin'
    
    console.log('📧 Test Email:', testEmail)
    console.log('👤 Test Name:', testName)
    console.log('🔑 Test Password:', testPassword)
    console.log('')
    
    console.log('1️⃣ Creating admin user...')
    
    // Create user using the same method as the signup API
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${envVars.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          full_name: testName,
          role: 'admin'
        }
      }
    })
    
    if (authError) {
      console.log('❌ Auth signup failed:', authError.message)
      console.log('Error code:', authError.status)
      console.log('')
      
      if (authError.message.includes('Error sending confirmation email')) {
        console.log('🎯 CONFIRMED: This is the same error you\'re experiencing!')
        console.log('')
        console.log('💡 SOLUTION:')
        console.log('1. Go to https://supabase.com/dashboard')
        console.log('2. Select your project: sukizydjcwupcogcvagg')
        console.log('3. Go to Authentication → Settings')
        console.log('4. Either:')
        console.log('   a) Configure SMTP settings, OR')
        console.log('   b) Disable "Enable email confirmations"')
        console.log('')
      }
      
      return
    }
    
    if (!authData.user) {
      console.log('❌ User creation failed - no user data returned')
      return
    }
    
    console.log('✅ User created successfully!')
    console.log('👤 User ID:', authData.user.id)
    console.log('📧 Email:', authData.user.email)
    console.log('✅ Email confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No')
    console.log('')
    
    if (!authData.user.email_confirmed_at) {
      console.log('⚠️  User needs email confirmation')
      console.log('📧 Check if confirmation email was sent to:', testEmail)
    }
    
    // Clean up test user
    console.log('2️⃣ Cleaning up test user...')
    
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
      
      if (deleteError) {
        console.log('⚠️  Could not delete test user:', deleteError.message)
        console.log('🔧 Manual cleanup required in Supabase dashboard')
      } else {
        console.log('✅ Test user cleaned up successfully')
      }
    } catch (cleanupError) {
      console.log('⚠️  Cleanup error:', cleanupError.message)
    }
    
    console.log('')
    console.log('🎉 Test completed successfully!')
    console.log('')
    console.log('📋 SUMMARY:')
    console.log('- User creation: ✅ Working')
    console.log('- Email confirmation: ' + (authData.user.email_confirmed_at ? '✅ Working' : '❌ Not working'))
    console.log('')
    
    if (!authData.user.email_confirmed_at) {
      console.log('🛠️  TO FIX EMAIL CONFIRMATION:')
      console.log('1. Configure SMTP in Supabase dashboard, OR')
      console.log('2. Disable email confirmations in Supabase dashboard')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAdminSignup()

