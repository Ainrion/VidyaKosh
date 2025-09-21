import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/schools - Get public school directory
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get schools with basic information (public directory)
    const { data: schools, error } = await supabase
      .from('schools')
      .select(`
        id,
        name,
        address,
        email,
        phone,
        logo_url,
        created_at
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching schools:', error)
      return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
    }

    // Get counts for each school
    const schoolsWithCounts = await Promise.all(
      schools.map(async (school) => {
        // Get course count
        const { count: courseCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)

        // Get member count
        const { count: memberCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)

        return {
          ...school,
          _count: {
            courses: courseCount || 0,
            profiles: memberCount || 0
          }
        }
      })
    )

    return NextResponse.json({ schools: schoolsWithCounts })
  } catch (error) {
    console.error('Error in /api/schools GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}