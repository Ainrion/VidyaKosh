import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error',
        schools: [] 
      }, { status: 500 })
    }

    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication error',
        schools: [] 
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not authenticated',
        schools: [] 
      }, { status: 401 })
    }
    
    // Get all schools for setup purposes
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching schools for setup:', error)
      // If RLS error, return empty array instead of error
      if (error.code === '42501' || error.message?.includes('permission')) {
        return NextResponse.json({ schools: [] })
      }
      return NextResponse.json({ 
        error: 'Failed to fetch schools',
        schools: [] 
      }, { status: 500 })
    }

    return NextResponse.json({ schools: schools || [] })
  } catch (error) {
    console.error('Error in setup schools API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      schools: [] 
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Create a default school if none exist
    const { data: existingSchools, error: checkError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1)

    if (checkError) {
      console.error('Error checking schools:', checkError)
      // If RLS error, try to create school anyway
      if (checkError.code === '42501' || checkError.message?.includes('permission')) {
        // Try to create a default school
        const { data: newSchool, error: createError } = await supabase
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
          school: newSchool,
          message: 'Default school created successfully' 
        })
      }
    }

    if (!existingSchools || existingSchools.length === 0) {
      // Create default school
      const { data: newSchool, error: createError } = await supabase
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
        school: newSchool,
        message: 'Default school created successfully' 
      })
    }

    return NextResponse.json({ 
      success: true, 
      school: existingSchools[0],
      message: 'Schools already exist' 
    })
  } catch (error) {
    console.error('Error in setup schools POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
