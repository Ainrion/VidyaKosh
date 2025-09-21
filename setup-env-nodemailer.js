#!/usr/bin/env node

/**
 * Environment Setup Script for Nodemailer
 * This script helps you create the .env.local file for Nodemailer configuration
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🔧 Vidyakosh LMS - Nodemailer Environment Setup\n');
  console.log('This script will help you create a .env.local file for Nodemailer SMTP configuration.\n');

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📧 Email Provider Selection:');
  console.log('1. Gmail (Recommended for testing)');
  console.log('2. Outlook/Hotmail');
  console.log('3. Yahoo');
  console.log('4. Custom SMTP Server');
  
  const providerChoice = await question('\nChoose your email provider (1-4): ');
  
  let smtpConfig = {};
  
  switch (providerChoice) {
    case '1':
      console.log('\n📧 Gmail SMTP Configuration:');
      smtpConfig = {
        host: 'smtp.gmail.com',
        port: '587',
        user: await question('Enter your Gmail address: '),
        pass: await question('Enter your Gmail app password (16 characters): '),
        from: await question('From email address (default: same as user): ') || undefined
      };
      break;
      
    case '2':
      console.log('\n📧 Outlook SMTP Configuration:');
      smtpConfig = {
        host: 'smtp-mail.outlook.com',
        port: '587',
        user: await question('Enter your Outlook email address: '),
        pass: await question('Enter your Outlook app password: '),
        from: await question('From email address (default: same as user): ') || undefined
      };
      break;
      
    case '3':
      console.log('\n📧 Yahoo SMTP Configuration:');
      smtpConfig = {
        host: 'smtp.mail.yahoo.com',
        port: '587',
        user: await question('Enter your Yahoo email address: '),
        pass: await question('Enter your Yahoo app password: '),
        from: await question('From email address (default: same as user): ') || undefined
      };
      break;
      
    case '4':
      console.log('\n📧 Custom SMTP Configuration:');
      smtpConfig = {
        host: await question('SMTP Host: '),
        port: await question('SMTP Port (default: 587): ') || '587',
        user: await question('SMTP Username: '),
        pass: await question('SMTP Password: '),
        from: await question('From email address (default: same as user): ') || undefined
      };
      break;
      
    default:
      console.log('❌ Invalid choice. Using Gmail as default.');
      smtpConfig = {
        host: 'smtp.gmail.com',
        port: '587',
        user: await question('Enter your Gmail address: '),
        pass: await question('Enter your Gmail app password (16 characters): '),
        from: await question('From email address (default: same as user): ') || undefined
      };
  }

  // Get site URL
  const siteUrl = await question('\n🌐 Enter your site URL (default: http://localhost:3000): ') || 'http://localhost:3000';

  // Check for existing Supabase configuration
  console.log('\n🗄️  Supabase Configuration:');
  const hasSupabase = await question('Do you already have Supabase configured? (y/N): ');
  
  let supabaseConfig = '';
  if (hasSupabase.toLowerCase() !== 'y') {
    const supabaseUrl = await question('Supabase Project URL (optional): ');
    const supabaseAnonKey = await question('Supabase Anon Key (optional): ');
    const supabaseServiceKey = await question('Supabase Service Role Key (optional): ');
    
    if (supabaseUrl) {
      supabaseConfig = `
# ========================================
# SUPABASE CONFIGURATION
# ========================================
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`;
    }
  }

  // Generate .env.local content
  const envContent = `# ========================================
# VIDYAKOSH LMS ENVIRONMENT CONFIGURATION
# ========================================

# ========================================
# NODEMAILER SMTP CONFIGURATION (Primary)
# ========================================
SMTP_HOST=${smtpConfig.host}
SMTP_PORT=${smtpConfig.port}
SMTP_USER=${smtpConfig.user}
SMTP_PASS=${smtpConfig.pass}
SMTP_FROM=${smtpConfig.from || smtpConfig.user}

# ========================================
# APPLICATION SETTINGS
# ========================================
NEXT_PUBLIC_SITE_URL=${siteUrl}${supabaseConfig}

# ========================================
# FALLBACK EMAIL PROVIDERS (Optional)
# ========================================
# Uncomment if you want to use these as fallbacks

# Resend (Fallback)
# RESEND_API_KEY=re_your_resend_api_key_here

# SendGrid (Fallback)
# SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# ========================================
# TESTING COMMANDS
# ========================================
# Test SMTP configuration:
# node test-nodemailer.js

# Send test email:
# node test-nodemailer.js your-email@gmail.com

# Test in application:
# curl http://localhost:3000/api/test-email
`;

  // Write the file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
    console.log(`📁 Location: ${envPath}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Verify your SMTP credentials are correct');
    console.log('2. Restart your development server: npm run dev');
    console.log('3. Test your configuration: node test-nodemailer.js');
    console.log('4. Send a test email: node test-nodemailer.js your-email@example.com');
    
    console.log('\n🔍 Your Configuration:');
    console.log(`SMTP Host: ${smtpConfig.host}`);
    console.log(`SMTP Port: ${smtpConfig.port}`);
    console.log(`SMTP User: ${smtpConfig.user}`);
    console.log(`SMTP From: ${smtpConfig.from || smtpConfig.user}`);
    console.log(`Site URL: ${siteUrl}`);
    
  } catch (error) {
    console.error('\n❌ Error creating .env.local file:', error.message);
  }

  rl.close();
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupEnvironment().catch(console.error);
}

export { setupEnvironment };
