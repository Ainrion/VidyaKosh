import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, address, phone, email, logo_url } = body

    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'School email is required' }, { status: 400 })
    }

    // Check if school with same name or email already exists
    const { data: existingSchools, error: checkError } = await supabase
      .from('schools')
      .select('id, name, email')
      .or(`name.ilike.${name},email.ilike.${email}`)

    if (checkError) {
      console.error('Error checking existing schools:', checkError)
      return NextResponse.json({ error: 'Failed to validate school data' }, { status: 500 })
    }

    if (existingSchools && existingSchools.length > 0) {
      const existingSchool = existingSchools[0]
      if (existingSchool.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json({ error: 'A school with this name already exists' }, { status: 400 })
      }
      if (existingSchool.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ error: 'A school with this email already exists' }, { status: 400 })
      }
    }

    // Create the school using service role client to bypass RLS
    const { data: school, error: createError } = await supabase
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
      return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
    }

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


