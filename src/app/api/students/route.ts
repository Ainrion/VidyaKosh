import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/students - Get students for enrollment management
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only admins and teachers can view students
    if (!['admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Determine which school's students to fetch
    let targetSchoolId = schoolId
    if (!targetSchoolId) {
      if (profile.role === 'admin') {
        targetSchoolId = profile.school_id
      } else {
        return NextResponse.json({ error: 'School ID is required for teachers' }, { status: 400 })
      }
    }

    // Verify the user has access to this school
    if (profile.role === 'teacher') {
      // Teachers can only see students from their own school
      if (targetSchoolId !== profile.school_id) {
        return NextResponse.json({ error: 'You can only view students from your own school' }, { status: 403 })
      }
    } else if (profile.role === 'admin') {
      // Admins can only see students from their own school
      if (targetSchoolId !== profile.school_id) {
        return NextResponse.json({ error: 'You can only view students from your own school' }, { status: 403 })
      }
    }

    // Get students using direct query
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active, created_at, school_access_granted')
      .eq('school_id', targetSchoolId)
      .eq('role', 'student')
      .order('full_name')

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch students',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      students: students || [],
      total: (students && Array.isArray(students)) ? students.length : 0
    })
  } catch (error) {
    console.error('Error in students GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}