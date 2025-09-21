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

async function fixUnconfirmedUsers() {
  try {
    console.log('🔧 Fixing Unconfirmed Users...')
    
    // Get all users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Cannot access auth users:', authError)
      return
    }
    
    // Find unconfirmed users
    const unconfirmedUsers = authUsers.users.filter(user => !user.email_confirmed_at)
    
    if (unconfirmedUsers.length === 0) {
      console.log('✅ All users are already confirmed!')
      return
    }
    
    console.log(`⚠️ Found ${unconfirmedUsers.length} unconfirmed users`)
    
    // Confirm each unconfirmed user
    for (const user of unconfirmedUsers) {
      console.log(`\n📧 Confirming user: ${user.email}`)
      
      try {
        const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        })
        
        if (error) {
          console.error(`❌ Failed to confirm ${user.email}:`, error.message)
        } else {
          console.log(`✅ Successfully confirmed ${user.email}`)
        }
      } catch (err) {
        console.error(`❌ Error confirming ${user.email}:`, err.message)
      }
    }
    
    console.log('\n🎉 Unconfirmed users fix completed!')
    console.log('\n📋 Next Steps:')
    console.log('1. Configure Supabase SMTP settings for future signups')
    console.log('2. Test with a new user signup to verify email confirmation works')
    console.log('3. Check that confirmed users can now log in normally')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Check if --confirm flag is provided
const args = process.argv.slice(2)
if (args.includes('--confirm')) {
  fixUnconfirmedUsers()
} else {
  console.log('🔧 Unconfirmed Users Fix Script')
  console.log('\nThis script will manually confirm all unconfirmed users in your Supabase project.')
  console.log('\nUsage:')
  console.log('  node fix-unconfirmed-users.js --confirm')
  console.log('\n⚠️  This will confirm all unconfirmed users without requiring email verification.')
  console.log('   Use this as a one-time fix while setting up proper email configuration.')
}
