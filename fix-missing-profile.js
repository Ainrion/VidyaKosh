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

async function fixMissingProfile() {
  try {
    console.log('🔧 Fixing Missing Profile...')
    
    const email = '08317711923_ds@vipstc.edu.in'
    console.log(`📧 Fixing profile for: ${email}`)
    
    // Get user from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Cannot access auth users:', authError)
      return
    }
    
    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      console.log(`❌ User not found: ${email}`)
      return
    }
    
    console.log(`✅ User found: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Created: ${user.created_at}`)
    console.log(`   Confirmed: ${user.email_confirmed_at}`)
    
    // Get the school ID from the signup logs
    // From the terminal logs, I can see the school ID was: dce2295f-82f8-49a9-ada8-2e1d06471290
    const schoolId = 'dce2295f-82f8-49a9-ada8-2e1d06471290'
    
    // Create the missing profile
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: 'Hardik', // From the signup logs
      role: 'admin',
      school_id: schoolId,
      is_active: true
    }
    
    console.log(`\n📝 Creating profile with data:`, profileData)
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      return
    }
    
    console.log('✅ Profile created successfully!')
    console.log(`   Profile ID: ${profile.id}`)
    console.log(`   Name: ${profile.full_name}`)
    console.log(`   Role: ${profile.role}`)
    console.log(`   School ID: ${profile.school_id}`)
    
    // Verify the school exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single()
    
    if (schoolError) {
      console.error('❌ School not found:', schoolError)
    } else {
      console.log(`✅ School verified: ${school.name}`)
    }
    
    console.log('\n🎉 Profile fix completed!')
    console.log('📋 The user should now be able to log in successfully.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixMissingProfile()
