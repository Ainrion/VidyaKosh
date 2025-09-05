import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if any schools exist
    const { data: existingSchools, error: checkError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1)

    if (checkError) {
      console.error('Error checking schools:', checkError)
      
      // If RLS error, try to create a default school anyway
      try {
        const { data: newDefaultSchool, error: createError } = await supabase
          .from('schools')
          .insert({
            name: 'Default School',
            address: 'Sample Address',
            email: 'admin@defaultschool.edu',
            phone: '+1-555-0123'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating default school:', createError)
          return NextResponse.json({ 
            error: 'Failed to create default school' 
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          school: newDefaultSchool,
          message: 'Default school created successfully' 
        })
      } catch (createError) {
        console.error('Error in fallback school creation:', createError)
        return NextResponse.json({ 
          error: 'Failed to create default school' 
        }, { status: 500 })
      }
    }

    // If schools exist, return the first one
    if (existingSchools && existingSchools.length > 0) {
      return NextResponse.json({ 
        success: true, 
        school: existingSchools[0],
        message: 'Schools already exist' 
      })
    }

    // Create default school if none exist
    const { data: newDefaultSchool, error: createError } = await supabase
      .from('schools')
      .insert({
        name: 'Default School',
        address: 'Sample Address',
        email: 'admin@defaultschool.edu',
        phone: '+1-555-0123'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating default school:', createError)
      return NextResponse.json({ 
        error: 'Failed to create default school' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      school: newDefaultSchool,
      message: 'Default school created successfully' 
    })
  } catch (error) {
    console.error('Error in ensure-default-school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
