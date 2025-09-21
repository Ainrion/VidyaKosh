import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/teachers/apply - Submit teacher application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { teacherName, teacherEmail, schoolId, message } = body

    // Validate required fields
    if (!teacherName || !teacherEmail || !schoolId) {
      return NextResponse.json({ 
        error: 'Missing required fields: teacherName, teacherEmail, schoolId' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(teacherEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    // Check if school exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', schoolId)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ 
        error: 'School not found' 
      }, { status: 404 })
    }

    // Check if there's already a pending application from this email for this school
    const { data: existingApplication, error: existingError } = await supabase
      .from('teacher_applications')
      .select('id, status')
      .eq('teacher_email', teacherEmail)
      .eq('school_id', schoolId)
      .eq('status', 'pending')
      .single()

    if (existingApplication) {
      return NextResponse.json({ 
        error: 'You already have a pending application for this school' 
      }, { status: 409 })
    }

    // Create the application
    const { data: application, error: applicationError } = await supabase
      .from('teacher_applications')
      .insert({
        teacher_name: teacherName,
        teacher_email: teacherEmail,
        school_id: schoolId,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Error creating teacher application:', applicationError)
      return NextResponse.json({ 
        error: 'Failed to submit application' 
      }, { status: 500 })
    }

    // TODO: Send notification email to school admins
    // This would be implemented with your email system

    return NextResponse.json({ 
      application,
      message: 'Application submitted successfully',
      schoolName: school.name
    })
  } catch (error) {
    console.error('Error in /api/teachers/apply POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
