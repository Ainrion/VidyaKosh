#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing .env.local file configuration...\n');

const envPath = '.env.local';

try {
  // Check if .env.local exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    console.log('Please create a .env.local file with your configuration');
    process.exit(1);
  }

  // Read current content
  const currentContent = fs.readFileSync(envPath, 'utf8');
  console.log('📋 Current .env.local content:');
  console.log('─'.repeat(50));
  console.log(currentContent);
  console.log('─'.repeat(50));

  // Check for SMTP configuration
  const hasSMTPHost = currentContent.includes('SMTP_HOST=');
  const hasSMTPUser = currentContent.includes('SMTP_USER=');
  const hasSMTPPass = currentContent.includes('SMTP_PASS=');

  console.log('\n🔍 SMTP Configuration Check:');
  console.log(`SMTP_HOST: ${hasSMTPHost ? '✅' : '❌'}`);
  console.log(`SMTP_USER: ${hasSMTPUser ? '✅' : '❌'}`);
  console.log(`SMTP_PASS: ${hasSMTPPass ? '✅' : '❌'}`);

  if (hasSMTPHost && hasSMTPUser && hasSMTPPass) {
    console.log('\n✅ SMTP configuration found in .env.local');
    console.log('📝 The issue might be:');
    console.log('  1. Extra spaces or indentation');
    console.log('  2. Wrong comment headers');
    console.log('  3. Server needs restart');
    
    console.log('\n🔧 Here\'s the corrected format:');
    console.log('─'.repeat(50));
    
    // Extract SMTP values
    const smtpHost = currentContent.match(/SMTP_HOST=(.+)/)?.[1]?.trim();
    const smtpPort = currentContent.match(/SMTP_PORT=(.+)/)?.[1]?.trim() || '587';
    const smtpUser = currentContent.match(/SMTP_USER=(.+)/)?.[1]?.trim();
    const smtpPass = currentContent.match(/SMTP_PASS=(.+)/)?.[1]?.trim();
    const smtpFrom = currentContent.match(/SMTP_FROM=(.+)/)?.[1]?.trim() || smtpUser;

    console.log(`# Email Configuration (SMTP)`);
    console.log(`SMTP_HOST=${smtpHost}`);
    console.log(`SMTP_PORT=${smtpPort}`);
    console.log(`SMTP_USER=${smtpUser}`);
    console.log(`SMTP_PASS=${smtpPass}`);
    console.log(`SMTP_FROM=${smtpFrom}`);
    
  } else {
    console.log('\n❌ SMTP configuration missing or incomplete');
    console.log('📝 Please add these lines to your .env.local:');
    console.log('─'.repeat(50));
    console.log('# Email Configuration (SMTP)');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your_16_character_app_password');
    console.log('SMTP_FROM=your-email@gmail.com');
  }

  console.log('\n🚀 Next Steps:');
  console.log('1. Update your .env.local file with the correct format above');
  console.log('2. Remove any extra spaces or indentation');
  console.log('3. Restart your development server: npm run dev');
  console.log('4. Test with: curl http://localhost:3000/api/test-email');

} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
}
