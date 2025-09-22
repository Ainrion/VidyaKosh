import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get the current user's profile to check if they're an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 })
    }

    const resolvedParams = await params
    const applicationId = resolvedParams.id
    const body = await request.json()
    const { rejection_reason } = body

    // Get the teacher application
    const { data: application, error: applicationError } = await supabase
      .from('teacher_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('school_id', profile.school_id)
      .single()

    if (applicationError || !application) {
      return NextResponse.json({ 
        error: 'Teacher application not found' 
      }, { status: 404 })
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Application has already been processed' 
      }, { status: 400 })
    }

    // Update the application status to rejected
    const { error: updateError } = await serviceSupabase
      .from('teacher_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id,
        rejection_reason: rejection_reason || null
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json({ 
        error: 'Failed to reject application' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Teacher application rejected'
    })

  } catch (error) {
    console.error('Error in reject application API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
