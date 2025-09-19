#!/usr/bin/env node

import fs from 'fs';

console.log('🧪 Verifying Email Configuration...\n');

// Read and parse .env.local file
let envVars = {};
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      }
    }
  });
}

console.log('📋 Environment Variables Check:');
console.log('─'.repeat(50));

const requiredVars = [
  'SMTP_HOST',
  'SMTP_USER', 
  'SMTP_PASS'
];

const optionalVars = [
  'SMTP_PORT',
  'SMTP_FROM'
];

let allRequired = true;

console.log('Required Variables:');
requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: Not set`);
    allRequired = false;
  }
});

console.log('\nOptional Variables:');
optionalVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set (using default)`);
  }
});

console.log('\n📊 Configuration Status:');
if (allRequired) {
  console.log('✅ All required SMTP variables are set!');
  console.log('🚀 Your email configuration should work now.');
  console.log('\n🧪 Test with: curl http://localhost:3000/api/test-email');
} else {
  console.log('❌ Missing required SMTP variables.');
  console.log('📝 Please add the missing variables to your .env.local file.');
}

console.log('\n🔍 Current SMTP Configuration:');
console.log(`Host: ${envVars.SMTP_HOST || 'Not set'}`);
console.log(`Port: ${envVars.SMTP_PORT || '587 (default)'}`);
console.log(`User: ${envVars.SMTP_USER || 'Not set'}`);
console.log(`Pass: ${envVars.SMTP_PASS ? 'Set (hidden)' : 'Not set'}`);
console.log(`From: ${envVars.SMTP_FROM || envVars.SMTP_USER || 'Not set'}`);
