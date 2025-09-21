import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const applicationId = params.id

    // Get the teacher application using service role client
    const { data: application, error: applicationError } = await serviceSupabase
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

    // Check if user already exists
    const { data: existingUser } = await serviceSupabase.auth.admin.listUsers()
    const userExists = existingUser.users?.some(u => u.email === application.teacher_email)

    if (userExists) {
      // User already exists, just update their profile
      console.log('User already exists, updating profile')
      const { error: profileUpdateError } = await serviceSupabase
        .from('profiles')
        .update({
          school_id: profile.school_id,
          school_access_granted: true,
          school_access_granted_at: new Date().toISOString(),
          school_access_granted_by: profile.id
        })
        .eq('email', application.teacher_email)
        .eq('role', 'teacher')

      if (profileUpdateError) {
        console.error('Error updating teacher profile:', profileUpdateError)
      }
    } else {
      // Create new user account
      console.log('Creating new teacher user account')
      const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
        email: application.teacher_email,
        password: application.teacher_password,
        email_confirm: true, // Auto-confirm the account
        user_metadata: {
          full_name: application.teacher_name,
          role: 'teacher'
        }
      })

      if (authError) {
        console.error('Error creating teacher account:', authError)
        return NextResponse.json({ 
          error: 'Failed to create teacher account' 
        }, { status: 500 })
      }

      // Update the profile created by trigger
      if (authData.user) {
        const { error: profileUpdateError } = await serviceSupabase
          .from('profiles')
          .update({
            school_id: profile.school_id,
            school_access_granted: true,
            school_access_granted_at: new Date().toISOString(),
            school_access_granted_by: profile.id
          })
          .eq('id', authData.user.id)

        if (profileUpdateError) {
          console.error('Error updating teacher profile:', profileUpdateError)
        }
      }
    }

    // Update the application status to approved
    const { error: updateError } = await serviceSupabase
      .from('teacher_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json({ 
        error: 'Failed to approve application' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Teacher application approved successfully'
    })

  } catch (error) {
    console.error('Error in approve application API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
