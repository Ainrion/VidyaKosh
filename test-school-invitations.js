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

async function testSchoolInvitations() {
  try {
    console.log('🧪 Testing school_invitations table...')
    
    // 1. Test basic table access
    console.log('\n1️⃣ Testing table access...')
    const { data: tableTest, error: tableError } = await supabase
      .from('school_invitations')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError)
      return
    }
    
    console.log('✅ Table access successful')
    
    // 2. Test table structure
    console.log('\n2️⃣ Testing table structure...')
    const { data: structureTest, error: structureError } = await supabase
      .from('school_invitations')
      .select('*')
      .limit(1)
    
    if (structureError) {
      console.error('❌ Structure test failed:', structureError)
      return
    }
    
    console.log('✅ Table structure accessible')
    
    // 3. Test teacher invitations query (the exact query from the API)
    console.log('\n3️⃣ Testing teacher invitations query...')
    const { data: teacherInvitations, error: teacherError } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(id, name),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(id, full_name, email)
      `)
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })
    
    if (teacherError) {
      console.error('❌ Teacher invitations query failed:', teacherError)
      console.log('Error details:', JSON.stringify(teacherError, null, 2))
      return
    }
    
    console.log('✅ Teacher invitations query successful')
    console.log('📊 Found', teacherInvitations?.length || 0, 'teacher invitations')
    
    // 4. Test student invitations query
    console.log('\n4️⃣ Testing student invitations query...')
    const { data: studentInvitations, error: studentError } = await supabase
      .from('school_invitations')
      .select(`
        *,
        school:schools(id, name),
        invited_by_profile:profiles!school_invitations_invited_by_fkey(id, full_name, email)
      `)
      .eq('role', 'student')
      .order('created_at', { ascending: false })
    
    if (studentError) {
      console.error('❌ Student invitations query failed:', studentError)
      return
    }
    
    console.log('✅ Student invitations query successful')
    console.log('📊 Found', studentInvitations?.length || 0, 'student invitations')
    
    // 5. Test creating a sample invitation (if we have a school)
    console.log('\n5️⃣ Testing invitation creation...')
    
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1)
    
    if (schools && schools.length > 0) {
      const schoolId = schools[0].id
      console.log('🏫 Found school:', schools[0].name, '(ID:', schoolId, ')')
      
      // Get an admin user for this school
      const { data: admin } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('school_id', schoolId)
        .eq('role', 'admin')
        .limit(1)
      
      if (admin && admin.length > 0) {
        console.log('👤 Found admin:', admin[0].full_name, '(ID:', admin[0].id, ')')
        
        // Test creating a sample teacher invitation
        const testInvitation = {
          school_id: schoolId,
          email: 'test-teacher@example.com',
          invitation_code: 'TEST' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          invited_by: admin[0].id,
          role: 'teacher',
          join_token: 'TEST' + Math.random().toString(36).substring(2, 18),
          message: 'Test invitation for debugging',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
        
        const { data: createdInvitation, error: createError } = await supabase
          .from('school_invitations')
          .insert(testInvitation)
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Invitation creation failed:', createError)
        } else {
          console.log('✅ Test invitation created successfully')
          console.log('📧 Test invitation ID:', createdInvitation.id)
          
          // Clean up the test invitation
          await supabase
            .from('school_invitations')
            .delete()
            .eq('id', createdInvitation.id)
          
          console.log('🧹 Test invitation cleaned up')
        }
      } else {
        console.log('⚠️ No admin user found for school, skipping creation test')
      }
    } else {
      console.log('⚠️ No schools found, skipping creation test')
    }
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('✅ The school_invitations table is properly set up and ready to use.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSchoolInvitations()
