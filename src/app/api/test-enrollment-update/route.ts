import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Test enrollment update API: Starting request')
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Test enrollment update API: User authenticated:', user.id)
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    console.log('Test enrollment update API: Profile found:', profile)
    
    // Check if enrollments table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('enrollments')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.log('Test enrollment update API: Enrollments table error:', tableError.message)
      return NextResponse.json({
        error: 'Enrollments table not found',
        details: tableError.message,
        suggestion: 'Please run the quick_enrollment_setup.sql script first'
      }, { status: 500 })
    }
    
    console.log('Test enrollment update API: Enrollments table exists')
    
    // Get a sample enrollment to test with
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, status, course_id, student_id')
      .limit(1)
    
    if (enrollmentsError) {
      console.log('Test enrollment update API: Error fetching enrollments:', enrollmentsError.message)
      return NextResponse.json({
        error: 'Error fetching enrollments',
        details: enrollmentsError.message
      }, { status: 500 })
    }
    
    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        error: 'No enrollments found to test with',
        suggestion: 'Create some enrollments first using the bulk enrollment feature'
      }, { status: 404 })
    }
    
    const testEnrollment = enrollments[0]
    console.log('Test enrollment update API: Testing with enrollment:', testEnrollment)
    
    // Test updating the enrollment status
    const newStatus = testEnrollment.status === 'active' ? 'completed' : 'active'
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({ status: newStatus })
      .eq('id', testEnrollment.id)
      .select('*')
      .single()
    
    if (updateError) {
      console.log('Test enrollment update API: Update error:', updateError.message)
      return NextResponse.json({
        error: 'Failed to update enrollment',
        details: updateError.message,
        debug: {
          enrollmentId: testEnrollment.id,
          newStatus,
          error: updateError
        }
      }, { status: 500 })
    }
    
    console.log('Test enrollment update API: Update successful:', updatedEnrollment)
    
    // Revert the change
    const { error: revertError } = await supabase
      .from('enrollments')
      .update({ status: testEnrollment.status })
      .eq('id', testEnrollment.id)
    
    if (revertError) {
      console.log('Test enrollment update API: Revert error:', revertError.message)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Enrollment update test successful',
      testData: {
        originalStatus: testEnrollment.status,
        newStatus,
        enrollmentId: testEnrollment.id,
        updatedEnrollment
      }
    })
    
  } catch (error) {
    console.error('Error in test enrollment update:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


