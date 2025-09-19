#!/usr/bin/env node

/**
 * Test script for enrollment APIs
 * Run with: node test-enrollment-apis.js
 */

const BASE_URL = 'http://localhost:3000'

async function testEndpoint(endpoint, description) {
  console.log(`\n🧪 Testing ${description}...`)
  console.log(`   URL: ${BASE_URL}${endpoint}`)
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    const data = await response.json()
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`)
      console.log(`   📊 Response:`, JSON.stringify(data, null, 2))
    } else {
      console.log(`   ❌ Status: ${response.status}`)
      console.log(`   🚨 Error:`, JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.log(`   💥 Network Error:`, error.message)
  }
}

async function runTests() {
  console.log('🚀 Starting Enrollment API Tests...')
  console.log('=' .repeat(50))
  
  // Test endpoints that don't require authentication
  await testEndpoint('/api/test-email', 'Email Configuration Test')
  
  // Test endpoints that require authentication (will return 401)
  await testEndpoint('/api/debug-enrollments', 'Debug Enrollments (requires auth)')
  await testEndpoint('/api/enrollments', 'Enrollments API (requires auth)')
  await testEndpoint('/api/students', 'Students API (requires auth)')
  
  console.log('\n' + '=' .repeat(50))
  console.log('📋 Test Summary:')
  console.log('   - 401 errors are expected for authenticated endpoints')
  console.log('   - Check if email configuration is working')
  console.log('   - Test authenticated endpoints in browser at /admin/enrollments')
  console.log('\n🎯 Next Steps:')
  console.log('   1. Go to http://localhost:3000/admin/enrollments')
  console.log('   2. Check browser console for errors')
  console.log('   3. Verify enrollment data loads correctly')
  console.log('   4. Test email configuration if needed')
}

// Run the tests
runTests().catch(console.error)

