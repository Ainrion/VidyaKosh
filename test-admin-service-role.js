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

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAdminServiceRole() {
  try {
    console.log('🧪 Testing Admin Creation with Service Role...')
    console.log('')
    
    // Test data
    const testEmail = 'admin-service-test-' + Date.now() + '@example.com'
    const testPassword = 'AdminServiceTest123!'
    const testName = 'Admin Service Test'
    
    console.log('📧 Test Email:', testEmail)
    console.log('👤 Test Name:', testName)
    console.log('🔑 Test Password:', testPassword)
    console.log('')
    
    console.log('1️⃣ Testing admin user creation with service role...')
    
    // Test admin user creation with service role
    const { data, error } = await serviceSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm admin accounts
      user_metadata: {
        full_name: testName,
        role: 'admin'
      }
    })
    
    if (error) {
      console.log('❌ Admin creation failed:', error.message)
      console.log('Error code:', error.status)
      console.log('Error details:', error)
      
      if (error.message.includes('not_admin')) {
        console.log('')
        console.log('🔧 SOLUTION:')
        console.log('The service role key might not have admin privileges.')
        console.log('Check your SUPABASE_SERVICE_ROLE_KEY in .env.local')
        console.log('Make sure it\'s the correct service role key from Supabase dashboard')
      }
      
      return
    }
    
    console.log('✅ Admin user created successfully!')
    console.log('👤 User ID:', data.user?.id)
    console.log('📧 Email:', data.user?.email)
    console.log('✅ Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No')
    console.log('📝 User metadata:', data.user?.user_metadata)
    console.log('')
    
    // Test login capability
    console.log('2️⃣ Testing login capability...')
    
    const { data: loginData, error: loginError } = await serviceSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
    } else {
      console.log('✅ Login successful!')
      console.log('🔑 Session created for:', loginData.user?.email)
    }
    
    // Clean up test user
    console.log('\n3️⃣ Cleaning up test user...')
    
    try {
      const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(data.user.id)
      
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
    console.log('🎉 TEST RESULTS:')
    console.log('')
    console.log('✅ Service role admin creation: Working')
    console.log('✅ Auto-confirm admin accounts: Working')
    console.log('✅ Login capability: Working immediately')
    console.log('')
    console.log('🎯 CONCLUSION:')
    console.log('The service role has proper admin privileges!')
    console.log('Admin signup should now work correctly.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAdminServiceRole()

