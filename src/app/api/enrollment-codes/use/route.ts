import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/enrollment-codes/use - Use enrollment code to join course
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Enrollment code is required' }, { status: 400 })
    }

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, school_access_granted')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only students can use enrollment codes
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can use enrollment codes' }, { status: 403 })
    }

    // Check if student has school access
    if (!profile.school_access_granted) {
      return NextResponse.json({ 
        error: 'You do not have school access. Please contact your administrator or use a school invitation to join.' 
      }, { status: 403 })
    }

    // Use the enrollment code
    const { data: result, error: useError } = await supabase
      .rpc('use_enrollment_code', {
        p_code: code,
        p_student_id: user.id
      })

    if (useError) {
      console.error('Error using enrollment code:', useError)
      return NextResponse.json({ 
        error: 'Failed to use enrollment code',
        details: useError.message 
      }, { status: 500 })
    }

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: result.message,
      course_title: result.course_title,
      code_uses_remaining: result.code_uses_remaining
    })
  } catch (error) {
    console.error('Error in enrollment code usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/enrollment-codes/use - Validate enrollment code
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Enrollment code is required' }, { status: 400 })
    }

    // Get enrollment code details
    const { data: enrollmentCode, error } = await supabase
      .from('course_enrollment_codes')
      .select(`
        *,
        course:courses(title, description, school_id),
        created_by_profile:profiles!course_enrollment_codes_created_by_fkey(full_name, email)
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !enrollmentCode) {
      return NextResponse.json({ 
        error: 'Invalid or inactive enrollment code' 
      }, { status: 404 })
    }

    // Check if code has expired
    if (enrollmentCode.expires_at && new Date(enrollmentCode.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Enrollment code has expired' 
      }, { status: 400 })
    }

    // Check if code has reached max uses
    if (enrollmentCode.max_uses && enrollmentCode.current_uses >= enrollmentCode.max_uses) {
      return NextResponse.json({ 
        error: 'Enrollment code has reached maximum uses' 
      }, { status: 400 })
    }

    // Calculate remaining uses
    const remainingUses = enrollmentCode.max_uses 
      ? enrollmentCode.max_uses - enrollmentCode.current_uses 
      : 'unlimited'

    return NextResponse.json({ 
      code: enrollmentCode,
      valid: true,
      remaining_uses: remainingUses,
      message: 'Enrollment code is valid'
    })
  } catch (error) {
    console.error('Error in enrollment code validation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


