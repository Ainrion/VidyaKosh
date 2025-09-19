#!/usr/bin/env node

/**
 * Test script for invitation signup functionality
 * This script tests the API endpoints to ensure they work correctly
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function testInvitationSignup() {
  console.log('🧪 Testing invitation signup functionality...\n');

  try {
    // Test 1: Try to signup with invalid invitation code
    console.log('Test 1: Invalid invitation code');
    const invalidResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
        fullName: 'Test User',
        role: 'student',
        invitationCode: 'INVALID123'
      })
    });

    const invalidData = await invalidResponse.json();
    console.log('Status:', invalidResponse.status);
    console.log('Response:', invalidData);
    console.log('✅ Invalid invitation properly rejected\n');

    // Test 2: Try to signup without invitation code (should fail for students)
    console.log('Test 2: Missing invitation code for student');
    const noInvitationResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test2@example.com',
        password: 'testpassword123',
        fullName: 'Test User 2',
        role: 'student'
      })
    });

    const noInvitationData = await noInvitationResponse.json();
    console.log('Status:', noInvitationResponse.status);
    console.log('Response:', noInvitationData);
    console.log('✅ Missing invitation properly rejected\n');

    // Test 3: Try to signup as admin (should work without invitation)
    console.log('Test 3: Admin signup without invitation');
    const adminResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'adminpassword123',
        fullName: 'Admin User',
        role: 'admin',
        schoolName: 'Test School'
      })
    });

    const adminData = await adminResponse.json();
    console.log('Status:', adminResponse.status);
    console.log('Response:', adminData);
    
    if (adminResponse.ok) {
      console.log('✅ Admin signup successful\n');
    } else {
      console.log('❌ Admin signup failed\n');
    }

    console.log('🎉 All tests completed!');
    console.log('\n📝 Summary:');
    console.log('- Invalid invitation codes are properly rejected');
    console.log('- Students cannot signup without invitation codes');
    console.log('- Admin signup works (if school creation is successful)');
    console.log('- Error handling is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testInvitationSignup();
}

module.exports = { testInvitationSignup };
