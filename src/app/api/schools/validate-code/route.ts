import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for school code validation
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await request.json()
    const { schoolCode } = body

    if (!schoolCode) {
      return NextResponse.json({ 
        error: 'School code is required' 
      }, { status: 400 })
    }

    const upperSchoolCode = schoolCode.toUpperCase().trim()

    // Validate school code
    const { data: school, error: schoolError } = await serviceSupabase
      .from('schools')
      .select('id, name, address, phone, email, school_code')
      .eq('school_code', upperSchoolCode)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ 
        error: 'Invalid school code. Please check the code and try again.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      school: {
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        school_code: school.school_code
      }
    })

  } catch (error) {
    console.error('Error validating school code:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
