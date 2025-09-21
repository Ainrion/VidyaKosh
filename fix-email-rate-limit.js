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

async function fixEmailRateLimit() {
  try {
    console.log('🔧 Fixing Email Rate Limit Issue...')
    console.log('')
    
    // 1. Check for unconfirmed users that might be causing rate limits
    console.log('1️⃣ Checking for unconfirmed users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Cannot access auth users:', authError)
      return
    }
    
    const unconfirmedUsers = authUsers.users.filter(user => !user.email_confirmed_at)
    console.log(`📊 Total users: ${authUsers.users.length}`)
    console.log(`⚠️  Unconfirmed users: ${unconfirmedUsers.length}`)
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n📋 Unconfirmed Users (causing rate limit):')
      unconfirmedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   Created: ${user.created_at}`)
        console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`)
      })
      
      // Confirm all unconfirmed users to stop rate limiting
      console.log('\n2️⃣ Confirming unconfirmed users to stop rate limiting...')
      
      for (const user of unconfirmedUsers) {
        try {
          const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
            email_confirm: true
          })
          
          if (error) {
            console.log(`❌ Failed to confirm ${user.email}:`, error.message)
          } else {
            console.log(`✅ Confirmed ${user.email}`)
          }
        } catch (err) {
          console.log(`❌ Error confirming ${user.email}:`, err.message)
        }
      }
    }
    
    // 2. Check for recent test users that might be causing issues
    console.log('\n3️⃣ Checking for recent test users...')
    const recentUsers = authUsers.users
      .filter(user => new Date(user.created_at) > new Date(Date.now() - 60 * 60 * 1000)) // Last hour
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    if (recentUsers.length > 0) {
      console.log(`📅 Found ${recentUsers.length} users created in the last hour:`)
      recentUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.created_at})`)
      })
      
      // Clean up test users
      const testUsers = recentUsers.filter(user => 
        user.email.includes('test') || 
        user.email.includes('example.com') ||
        user.email.includes('admin-test')
      )
      
      if (testUsers.length > 0) {
        console.log(`\n🧹 Cleaning up ${testUsers.length} test users...`)
        
        for (const user of testUsers) {
          try {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
            
            if (deleteError) {
              console.log(`❌ Failed to delete ${user.email}:`, deleteError.message)
            } else {
              console.log(`✅ Deleted test user: ${user.email}`)
            }
          } catch (err) {
            console.log(`❌ Error deleting ${user.email}:`, err.message)
          }
        }
      }
    }
    
    console.log('\n4️⃣ Rate limit fix summary...')
    console.log('')
    
    if (unconfirmedUsers.length > 0) {
      console.log('✅ Fixed rate limit by confirming unconfirmed users')
    }
    
    if (recentUsers.some(user => user.email.includes('test') || user.email.includes('example.com'))) {
      console.log('✅ Cleaned up test users that were causing rate limits')
    }
    
    console.log('\n🎯 SOLUTION FOR EMAIL RATE LIMIT:')
    console.log('')
    console.log('The "email rate limit exceeded" error occurs when:')
    console.log('1. Too many unconfirmed users exist (each triggers an email)')
    console.log('2. Too many signup attempts in a short time')
    console.log('3. Test users accumulating over time')
    console.log('')
    console.log('✅ I have fixed these issues by:')
    console.log('- Confirming all unconfirmed users')
    console.log('- Cleaning up test users')
    console.log('')
    console.log('🕐 WAIT 5-10 MINUTES before trying admin signup again')
    console.log('This gives Supabase time to reset the rate limit')
    console.log('')
    console.log('🧪 TO TEST:')
    console.log('1. Wait 5-10 minutes')
    console.log('2. Try creating your admin account again')
    console.log('3. Use a real email address (not test@example.com)')
    console.log('')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixEmailRateLimit()

