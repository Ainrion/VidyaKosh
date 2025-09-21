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

async function checkSpecificUsers() {
  try {
    console.log('🔍 Checking Specific Users...')
    
    // Check the users mentioned in the terminal logs
    const emailsToCheck = [
      'hardik2004s@gmail.com',
      '08317711923_ds@vipstc.edu.in'
    ]
    
    for (const email of emailsToCheck) {
      console.log(`\n📧 Checking user: ${email}`)
      
      // Get user from auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('❌ Cannot access auth users:', authError)
        continue
      }
      
      const user = authUsers.users.find(u => u.email === email)
      
      if (!user) {
        console.log(`   ❌ User not found in auth.users`)
        continue
      }
      
      console.log(`   ✅ User found in auth.users`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Confirmed: ${user.email_confirmed_at || 'Not confirmed'}`)
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
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
        
        // Check if school exists
        if (profile.school_id) {
          const { data: school, error: schoolError } = await supabase
            .from('schools')
            .select('*')
            .eq('id', profile.school_id)
            .single()
          
          if (schoolError) {
            console.log(`   ❌ School access error: ${schoolError.message}`)
          } else {
            console.log(`   ✅ School accessible: ${school.name}`)
          }
        } else {
          console.log(`   ⚠️ No school assigned - this could cause login issues!`)
        }
      }
    }
    
    // Also check all admin profiles
    console.log('\n👑 Checking all admin profiles...')
    
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
    
    if (adminError) {
      console.error('❌ Error getting admin profiles:', adminError)
    } else {
      console.log(`📊 Found ${adminProfiles.length} admin profiles`)
      
      adminProfiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. ${profile.email} (${profile.full_name})`)
        console.log(`   School ID: ${profile.school_id}`)
        console.log(`   Created: ${profile.created_at}`)
        
        if (!profile.school_id) {
          console.log(`   ⚠️ WARNING: No school assigned!`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkSpecificUsers()
