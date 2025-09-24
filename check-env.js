#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 Checking .env.local file...\n')

try {
  const envPath = join(__dirname, '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  
  console.log('📋 Current .env.local content:')
  console.log('─'.repeat(60))
  console.log(envContent)
  console.log('─'.repeat(60))
  
  // Parse environment variables
  const envVars = {}
  envContent.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  
  console.log('\n🔍 Environment Variables Check:')
  console.log('─'.repeat(60))
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  let allPresent = true
  requiredVars.forEach(varName => {
    const value = envVars[varName]
    const status = value ? '✅' : '❌'
    const displayValue = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NOT SET'
    console.log(`${status} ${varName}: ${displayValue}`)
    if (!value) allPresent = false
  })
  
  console.log('─'.repeat(60))
  
  if (allPresent) {
    console.log('\n✅ All required environment variables are present!')
    console.log('🚀 Your Socket.IO server should start successfully.')
  } else {
    console.log('\n❌ Missing required environment variables!')
    console.log('\n📝 Please add these variables to your .env.local file:')
    console.log('─'.repeat(60))
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here')
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here')
    console.log('─'.repeat(60))
    console.log('\n💡 You can find these values in your Supabase project dashboard:')
    console.log('   https://supabase.com/dashboard/project/[your-project]/settings/api')
  }
  
} catch (error) {
  console.error('❌ Error reading .env.local file:', error.message)
  console.log('\n📝 Please create a .env.local file with your Supabase configuration.')
}

