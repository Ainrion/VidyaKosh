import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Use service role client for school validation and application creation
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const supabase = await createClient() // Regular client for auth operations
    const body = await request.json()
    const { email, password, fullName, schoolCode } = body

    console.log('Teacher application received:', { 
      email, 
      fullName, 
      schoolCode,
      password: '[HIDDEN]'
    })

    if (!email || !password || !fullName || !schoolCode) {
      console.error('Missing required fields:', { 
        email: !!email, 
        password: !!password, 
        fullName: !!fullName, 
        schoolCode: !!schoolCode 
      })
      return NextResponse.json({ 
        error: 'Email, password, full name, and school code are required' 
      }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Check if school code exists using service role client
    const { data: school, error: schoolError } = await serviceSupabase
      .from('schools')
      .select('id, name, school_code')
      .eq('school_code', schoolCode.toUpperCase())
      .single()

    if (schoolError || !school) {
      console.error('Invalid school code:', schoolCode)
      return NextResponse.json({ 
        error: 'Invalid school code. Please check the code and try again.' 
      }, { status: 400 })
    }

    // Check if teacher already has an application for this school using service role client
    const { data: existingApplication, error: checkError } = await serviceSupabase
      .from('teacher_applications')
      .select('id, status')
      .eq('teacher_email', email)
      .eq('school_id', school.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing application:', checkError)
      return NextResponse.json({ 
        error: 'Failed to check existing applications' 
      }, { status: 500 })
    }

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return NextResponse.json({ 
          error: 'You already have a pending application for this school.' 
        }, { status: 400 })
      } else if (existingApplication.status === 'approved') {
        return NextResponse.json({ 
          error: 'You have already been approved for this school. Please try logging in.' 
        }, { status: 400 })
      }
    }

    // Create teacher application first (no user account until approved)
    console.log('Creating teacher application')
    const { data: application, error: applicationError } = await serviceSupabase
      .from('teacher_applications')
      .insert({
        teacher_email: email,
        teacher_name: fullName,
        teacher_password: password, // Store password temporarily for approval
        school_id: school.id,
        message: `Teacher application for ${school.name}`,
        status: 'pending'
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Application creation error:', applicationError)
      return NextResponse.json({ 
        error: 'Failed to create teacher application' 
      }, { status: 500 })
    }

    console.log('Teacher application created successfully:', application.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Your application has been submitted successfully! Please wait for admin approval.',
      applicationId: application.id,
      schoolName: school.name,
      status: 'pending',
      emailConfirmationSent: false,
      requiresEmailConfirmation: false
    })

  } catch (error) {
    console.error('Error in teacher application:', error)
    
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'User already exists with this email.'
        statusCode = 400
      } else {
        errorMessage = error.message || 'Internal server error'
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined
    }, { status: statusCode })
  }
}