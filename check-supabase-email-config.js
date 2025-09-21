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

async function checkSupabaseEmailConfig() {
  try {
    console.log('🔍 Checking Supabase Email Configuration...')
    
    // 1. Check if we can access auth settings (limited by API)
    console.log('\n1️⃣ Checking authentication setup...')
    
    // Test basic auth functionality
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Cannot access auth users:', authError)
      return
    }
    
    console.log('✅ Supabase auth is accessible')
    console.log('📊 Found', authUsers?.users?.length || 0, 'total users')
    
    // 2. Check for unconfirmed users
    console.log('\n2️⃣ Checking email confirmation status...')
    
    const unconfirmedUsers = authUsers.users.filter(user => !user.email_confirmed_at)
    console.log('⚠️ Found', unconfirmedUsers.length, 'unconfirmed users')
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n📋 Unconfirmed Users:')
      unconfirmedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   Created: ${user.created_at}`)
        console.log(`   Confirmed: ${user.email_confirmed_at || 'Not confirmed'}`)
      })
    }
    
    // 3. Check teacher profiles
    console.log('\n3️⃣ Checking teacher profiles...')
    
    const { data: teacherProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
    
    if (profilesError) {
      console.error('❌ Error getting teacher profiles:', profilesError)
    } else {
      console.log('✅ Teacher profiles accessible')
      console.log('🎓 Found', teacherProfiles?.length || 0, 'teacher profiles')
      
      if (teacherProfiles && teacherProfiles.length > 0) {
        // Check which teachers are unconfirmed
        const unconfirmedTeachers = teacherProfiles.filter(profile => {
          const authUser = authUsers.users.find(u => u.email === profile.email)
          return authUser && !authUser.email_confirmed_at
        })
        
        console.log('⚠️ Found', unconfirmedTeachers.length, 'unconfirmed teachers')
        
        if (unconfirmedTeachers.length > 0) {
          console.log('\n📋 Unconfirmed Teachers:')
          unconfirmedTeachers.forEach((teacher, index) => {
            console.log(`${index + 1}. ${teacher.email} (${teacher.full_name})`)
          })
        }
      }
    }
    
    // 4. Test sending a confirmation email (if possible)
    console.log('\n4️⃣ Testing email functionality...')
    
    // Try to send a test email to an unconfirmed user
    if (unconfirmedUsers.length > 0) {
      const testUser = unconfirmedUsers[0]
      console.log(`🧪 Testing email for: ${testUser.email}`)
      
      try {
        // Note: This might not work depending on Supabase configuration
        const { data, error } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: testUser.email,
          password: 'dummy-password' // This won't actually change the password
        })
        
        if (error) {
          console.log('❌ Cannot generate confirmation link:', error.message)
          console.log('💡 This suggests email configuration issues')
        } else {
          console.log('✅ Can generate confirmation links')
          console.log('📧 Link generated:', data.properties?.action_link ? 'Yes' : 'No')
        }
      } catch (err) {
        console.log('❌ Email test failed:', err.message)
      }
    }
    
    // 5. Provide recommendations
    console.log('\n🛠️ Recommendations:')
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n📧 Email Confirmation Issues Detected:')
      console.log('1. Go to Supabase Dashboard → Authentication → Settings')
      console.log('2. Enable "Email confirmations" if not already enabled')
      console.log('3. Configure SMTP settings with your email provider')
      console.log('4. Set proper Site URL and Redirect URLs')
      console.log('5. Test with a new user signup')
      
      console.log('\n🔧 Quick Fix for Existing Users:')
      console.log('1. Go to Supabase Dashboard → Authentication → Users')
      console.log('2. Find unconfirmed users and click "Confirm User"')
      console.log('3. Or run: node fix-teacher-email-confirmation.js --confirm')
    } else {
      console.log('✅ All users are confirmed!')
    }
    
    console.log('\n📋 Next Steps:')
    console.log('1. Check your .env.local for SMTP settings:')
    console.log('   - SMTP_HOST')
    console.log('   - SMTP_USER') 
    console.log('   - SMTP_PASS')
    console.log('2. Configure these same settings in Supabase Dashboard')
    console.log('3. Enable email confirmations in Supabase')
    console.log('4. Test with a new teacher signup')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkSupabaseEmailConfig()
