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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key for admin access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
// Create Supabase client with anon key (like the frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLoginProcess() {
  try {
    console.log('🔍 Testing Login Process...')
    
    // 1. Get all users to find recent admin users
    console.log('\n1️⃣ Finding recent admin users...')
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Cannot access auth users:', authError)
      return
    }
    
    // Find recent admin users (created in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUsers = authUsers.users.filter(user => 
      new Date(user.created_at) > oneHourAgo
    )
    
    console.log(`📊 Found ${recentUsers.length} users created in the last hour`)
    
    if (recentUsers.length === 0) {
      console.log('⚠️ No recent users found. Please create a new admin account first.')
      return
    }
    
    // 2. Test login for each recent user
    for (const user of recentUsers) {
      console.log(`\n🧪 Testing login for: ${user.email}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Confirmed: ${user.email_confirmed_at || 'Not confirmed'}`)
      
      // Check if user has a profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.log(`   ❌ Profile error: ${profileError.message}`)
        if (profileError.code === 'PGRST116') {
          console.log('   💡 Profile does not exist - this is the issue!')
        }
      } else {
        console.log(`   ✅ Profile found: ${profile.full_name} (${profile.role})`)
        console.log(`   School ID: ${profile.school_id}`)
      }
      
      // Test if we can access the user's school
      if (profile && profile.school_id) {
        const { data: school, error: schoolError } = await supabaseAdmin
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .single()
        
        if (schoolError) {
          console.log(`   ❌ School access error: ${schoolError.message}`)
        } else {
          console.log(`   ✅ School accessible: ${school.name}`)
        }
      }
    }
    
    // 3. Test profile access with different approaches
    console.log('\n2️⃣ Testing profile access methods...')
    
    if (recentUsers.length > 0) {
      const testUser = recentUsers[0]
      
      // Test 1: Direct profile access
      console.log(`\n📋 Test 1: Direct profile access for ${testUser.email}`)
      const { data: directProfile, error: directError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single()
      
      if (directError) {
        console.log(`   ❌ Direct access failed: ${directError.message}`)
        console.log(`   Error code: ${directError.code}`)
      } else {
        console.log(`   ✅ Direct access successful`)
      }
      
      // Test 2: Profile access with RLS
      console.log(`\n📋 Test 2: Profile access with RLS simulation`)
      // This simulates what happens when a user is logged in
      const { data: rlsProfile, error: rlsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single()
      
      if (rlsError) {
        console.log(`   ❌ RLS access failed: ${rlsError.message}`)
        console.log(`   Error code: ${rlsError.code}`)
      } else {
        console.log(`   ✅ RLS access successful`)
      }
    }
    
    // 4. Provide recommendations
    console.log('\n🛠️ Recommendations:')
    
    const usersWithoutProfiles = []
    for (const user of recentUsers) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (!profile) {
        usersWithoutProfiles.push(user)
      }
    }
    
    if (usersWithoutProfiles.length > 0) {
      console.log('\n❌ Users without profiles detected:')
      usersWithoutProfiles.forEach(user => {
        console.log(`   - ${user.email}`)
      })
      console.log('\n💡 This is likely the cause of login failures!')
      console.log('   The signup process creates the user but fails to create the profile.')
    } else {
      console.log('\n✅ All recent users have profiles')
      console.log('   Login issues might be due to:')
      console.log('   1. RLS policy restrictions')
      console.log('   2. Profile data inconsistencies')
      console.log('   3. School access issues')
    }
    
    console.log('\n📋 Next Steps:')
    console.log('1. Check browser console for specific error messages')
    console.log('2. Verify the signup API is creating profiles correctly')
    console.log('3. Test login with a known working account')
    console.log('4. Check RLS policies for profile access')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testLoginProcess()
