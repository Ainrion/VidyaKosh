// Switch email provider configuration
// Run with: node switch-email-provider.js [provider]

import fs from 'fs'
import path from 'path'

const providers = {
  sendgrid: {
    name: 'SendGrid',
    envVars: {
      SENDGRID_API_KEY: 'your_sendgrid_api_key_here'
    },
    removeVars: ['RESEND_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'MAILGUN_API_KEY', 'MAILGUN_DOMAIN']
  },
  gmail: {
    name: 'Gmail SMTP',
    envVars: {
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'your-email@gmail.com',
      SMTP_PASS: 'your_16_character_app_password',
      SMTP_FROM: 'your-email@gmail.com'
    },
    removeVars: ['RESEND_API_KEY', 'SENDGRID_API_KEY', 'MAILGUN_API_KEY', 'MAILGUN_DOMAIN']
  },
  outlook: {
    name: 'Outlook SMTP',
    envVars: {
      SMTP_HOST: 'smtp-mail.outlook.com',
      SMTP_PORT: '587',
      SMTP_USER: 'your-email@outlook.com',
      SMTP_PASS: 'your_app_password',
      SMTP_FROM: 'your-email@outlook.com'
    },
    removeVars: ['RESEND_API_KEY', 'SENDGRID_API_KEY', 'MAILGUN_API_KEY', 'MAILGUN_DOMAIN']
  },
  mailgun: {
    name: 'Mailgun',
    envVars: {
      MAILGUN_API_KEY: 'your_mailgun_api_key',
      MAILGUN_DOMAIN: 'your_domain.mailgun.org'
    },
    removeVars: ['RESEND_API_KEY', 'SENDGRID_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
  }
}

function switchEmailProvider(provider) {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!')
    console.log('Please create a .env.local file first.')
    return
  }
  
  if (!providers[provider]) {
    console.log('❌ Invalid provider!')
    console.log('Available providers:', Object.keys(providers).join(', '))
    return
  }
  
  const providerConfig = providers[provider]
  console.log(`🔄 Switching to ${providerConfig.name}...`)
  
  // Read current .env.local
  let envContent = fs.readFileSync(envPath, 'utf8')
  
  // Remove old email provider variables
  providerConfig.removeVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=.*$`, 'gm')
    envContent = envContent.replace(regex, '')
  })
  
  // Add new provider variables
  const newVars = Object.entries(providerConfig.envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  envContent += `\n# Email Provider: ${providerConfig.name}\n${newVars}\n`
  
  // Write back to file
  fs.writeFileSync(envPath, envContent)
  
  console.log(`✅ Switched to ${providerConfig.name}!`)
  console.log('\n📝 Next steps:')
  console.log('1. Update the placeholder values in .env.local with your actual credentials')
  console.log('2. Restart your development server')
  console.log('3. Run: node test-email-setup.js to test the configuration')
  
  console.log('\n📋 Required credentials:')
  Object.entries(providerConfig.envVars).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`)
  })
}

// Get provider from command line argument
const provider = process.argv[2]

if (!provider) {
  console.log('📧 Email Provider Switcher')
  console.log('\nUsage: node switch-email-provider.js [provider]')
  console.log('\nAvailable providers:')
  Object.entries(providers).forEach(([key, config]) => {
    console.log(`   ${key}: ${config.name}`)
  })
  console.log('\nExample: node switch-email-provider.js sendgrid')
} else {
  switchEmailProvider(provider)
}

