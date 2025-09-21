import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the user after successful authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has a profile, if not redirect to setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // User needs to complete setup
          return NextResponse.redirect(`${origin}/setup`)
        }

        // Check if user has institution memberships
        const { data: memberships } = await supabase
          .from('user_institutions')
          .select('institution_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (!memberships || memberships.length === 0) {
          // User needs to join an institution
          return NextResponse.redirect(`${origin}/setup?step=institution`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
