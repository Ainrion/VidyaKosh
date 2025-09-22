import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ 
        error: 'Email parameter is required' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the teacher application with school information
    const { data: application, error } = await supabase
      .from('teacher_applications')
      .select(`
        id,
        teacher_email,
        teacher_name,
        school_id,
        message,
        status,
        created_at,
        reviewed_at,
        rejection_reason,
        school:schools(
          id,
          name,
          address,
          email
        )
      `)
      .eq('teacher_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ 
          error: 'No application found for this email address' 
        }, { status: 404 })
      }
      
      console.error('Error fetching application:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch application status' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      application: application
    })

  } catch (error) {
    console.error('Error in application status API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
