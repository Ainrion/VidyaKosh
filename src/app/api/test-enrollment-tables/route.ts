import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/test-enrollment-tables - Test if enrollment tables exist
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const results: any = {
      tables: {},
      functions: {},
      errors: []
    }

    // Test course_enrollment_codes table
    try {
      const { data, error } = await supabase
        .from('course_enrollment_codes')
        .select('id')
        .limit(1)

      if (error) {
        results.tables.course_enrollment_codes = {
          exists: false,
          error: error.message,
          code: error.code
        }
        results.errors.push(`course_enrollment_codes: ${error.message}`)
      } else {
        results.tables.course_enrollment_codes = {
          exists: true,
          count: data.length
        }
      }
    } catch (error) {
      results.tables.course_enrollment_codes = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      results.errors.push(`course_enrollment_codes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test enrollment_code_usage table
    try {
      const { data, error } = await supabase
        .from('enrollment_code_usage')
        .select('id')
        .limit(1)

      if (error) {
        results.tables.enrollment_code_usage = {
          exists: false,
          error: error.message,
          code: error.code
        }
        results.errors.push(`enrollment_code_usage: ${error.message}`)
      } else {
        results.tables.enrollment_code_usage = {
          exists: true,
          count: data.length
        }
      }
    } catch (error) {
      results.tables.enrollment_code_usage = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      results.errors.push(`enrollment_code_usage: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test enrollments table (should exist)
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .limit(1)

      if (error) {
        results.tables.enrollments = {
          exists: false,
          error: error.message,
          code: error.code
        }
        results.errors.push(`enrollments: ${error.message}`)
      } else {
        results.tables.enrollments = {
          exists: true,
          count: data.length
        }
      }
    } catch (error) {
      results.tables.enrollments = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      results.errors.push(`enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test use_enrollment_code function
    try {
      const { data, error } = await supabase
        .rpc('use_enrollment_code', {
          p_code: 'TEST123',
          p_student_id: '00000000-0000-0000-0000-000000000000'
        })

      if (error && error.code === '42883') { // Function doesn't exist
        results.functions.use_enrollment_code = {
          exists: false,
          error: 'Function does not exist',
          code: error.code
        }
        results.errors.push(`use_enrollment_code function: Does not exist`)
      } else if (error) {
        results.functions.use_enrollment_code = {
          exists: true,
          error: error.message,
          note: 'Function exists but test call failed (expected)'
        }
      } else {
        results.functions.use_enrollment_code = {
          exists: true,
          result: data
        }
      }
    } catch (error) {
      results.functions.use_enrollment_code = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      results.errors.push(`use_enrollment_code function: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test generate_enrollment_code function
    try {
      const { data, error } = await supabase
        .rpc('generate_enrollment_code')

      if (error && error.code === '42883') { // Function doesn't exist
        results.functions.generate_enrollment_code = {
          exists: false,
          error: 'Function does not exist',
          code: error.code
        }
        results.errors.push(`generate_enrollment_code function: Does not exist`)
      } else if (error) {
        results.functions.generate_enrollment_code = {
          exists: true,
          error: error.message
        }
      } else {
        results.functions.generate_enrollment_code = {
          exists: true,
          result: data
        }
      }
    } catch (error) {
      results.functions.generate_enrollment_code = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      results.errors.push(`generate_enrollment_code function: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results: results,
      summary: {
        tablesExist: Object.values(results.tables).filter((t: any) => t.exists).length,
        totalTables: Object.keys(results.tables).length,
        functionsExist: Object.values(results.functions).filter((f: any) => f.exists).length,
        totalFunctions: Object.keys(results.functions).length,
        errors: results.errors.length
      },
      message: results.errors.length === 0 
        ? 'All enrollment system components are working'
        : 'Some enrollment system components are missing'
    })

  } catch (error) {
    console.error('Error testing enrollment tables:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
