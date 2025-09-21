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

async function fixUserWithoutSchool() {
  try {
    console.log('🔧 Fixing User Without School...')
    
    const email = 'yibiye8346@dawhe.com'
    console.log(`📧 Fixing school assignment for: ${email}`)
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError)
      return
    }
    
    console.log(`✅ Profile found: ${profile.full_name} (${profile.role})`)
    console.log(`   Current School ID: ${profile.school_id}`)
    
    // Find a suitable school to assign (use the default school)
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .limit(1)
    
    if (schoolsError) {
      console.error('❌ Error getting schools:', schoolsError)
      return
    }
    
    if (!schools || schools.length === 0) {
      console.error('❌ No schools found')
      return
    }
    
    const school = schools[0]
    console.log(`📚 Assigning school: ${school.name} (${school.id})`)
    
    // Update the profile with the school
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ school_id: school.id })
      .eq('id', profile.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      return
    }
    
    console.log('✅ Profile updated successfully!')
    console.log(`   New School ID: ${updatedProfile.school_id}`)
    console.log(`   School Name: ${school.name}`)
    
    console.log('\n🎉 School assignment fix completed!')
    console.log('📋 The user should now be able to log in successfully.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixUserWithoutSchool()
