import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // For client-side, we need to access these from the global environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sukizydjcwupcogcvagg.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1a2l6eWRqY3d1cGNvZ2N2YWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODI4ODIsImV4cCI6MjA3MTE1ODg4Mn0.3fW90Uw8We_6pu8zRxTSMwRZoG7fz3JGFLdPHO0mpjk'
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
