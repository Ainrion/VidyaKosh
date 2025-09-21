import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, email, logo_url } = body

    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'School email is required' }, { status: 400 })
    }

    // Check if school with same name or email already exists using service role
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: existingSchools, error: checkError } = await serviceSupabase
      .from('schools')
      .select('id, name, email')
      .or(`name.ilike.${name},email.ilike.${email}`)

    if (checkError) {
      console.error('Error checking existing schools:', checkError)
      return NextResponse.json({ error: 'Failed to validate school data' }, { status: 500 })
    }

    console.log('Existing schools check:', { name, email, existingSchools })

    if (existingSchools && existingSchools.length > 0) {
      const existingSchool = existingSchools[0]
      console.log('Found existing school:', existingSchool)
      
      if (existingSchool.name.toLowerCase() === name.toLowerCase()) {
        console.log('School name conflict detected')
        return NextResponse.json({ 
          error: 'A school with this name already exists',
          details: `A school named "${existingSchool.name}" already exists in the system. Please choose a different name.`
        }, { status: 400 })
      }
      if (existingSchool.email.toLowerCase() === email.toLowerCase()) {
        console.log('School email conflict detected')
        return NextResponse.json({ 
          error: 'A school with this email already exists',
          details: `A school with email "${existingSchool.email}" already exists in the system. Please use a different email.`
        }, { status: 400 })
      }
    }

    // Create the school using service role client to bypass RLS
    console.log('Creating school with data:', { name, address, phone, email, logo_url })
    
    const { data: school, error: createError } = await serviceSupabase
      .from('schools')
      .insert({
        name,
        address: address || null,
        phone: phone || null,
        email,
        logo_url: logo_url || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating school:', createError)
      console.error('Error details:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code
      })
      return NextResponse.json({ 
        error: 'Failed to create school',
        details: createError.message 
      }, { status: 500 })
    }

    console.log('School created successfully:', school)
    return NextResponse.json({ 
      success: true,
      school,
      message: 'School created successfully' 
    })
  } catch (error) {
    console.error('Error in POST /api/schools/public:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


