'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toastMessages } from '@/lib/toast'

interface Student {
  id: string
  full_name: string
  email: string
  is_active: boolean
  created_at: string
}

interface Enrollment {
  enrollment_id: string
  student_id: string
  student_name: string
  student_email: string
  course_id: string
  course_title: string
  status: string
  enrolled_at: string
  enrolled_by: string
  enrolled_by_name: string
  approved_by: string
  approved_by_name: string
  approved_at: string
  notes: string
}

interface Course {
  id: string
  title: string
  school_id: string
}

export default function EnrollmentManagement() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [bulkEnrollmentOpen, setBulkEnrollmentOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchEnrollments(),
        fetchStudents(),
        fetchCourses()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollments = async () => {
    try {
      console.log('Fetching enrollments...')
      // Try the main API first
      let response = await fetch('/api/enrollments')
      console.log('Enrollments response status:', response.status)
      
      // If main API fails, try the simple fallback
      if (!response.ok) {
        console.log('Main enrollments API failed, trying simple fallback...')
        response = await fetch('/api/enrollments-simple')
        console.log('Simple enrollments response status:', response.status)
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Enrollments API error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Enrollments API response data:', data)
      
      if (data.error) throw new Error(data.error)
      
      setEnrollments(data.enrollments || [])
      
      // Show helpful message if no enrollments found
      if (data.message) {
        console.log('Enrollments API message:', data.message)
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      setEnrollments([]) // Set empty array on error
      
      // Show user-friendly error message
      alert(`Failed to load enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchStudents = async () => {
    try {
      // Try the main API first
      let response = await fetch('/api/students')
      
      // If main API fails, try the simple fallback
      if (!response.ok) {
        console.log('Main students API failed, trying simple fallback...')
        response = await fetch('/api/students-simple')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setStudents(data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([]) // Set empty array on error
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, school_id')
        .eq('school_id', profile?.school_id)
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleBulkEnrollment = async () => {
    if (!selectedCourse || selectedStudents.length === 0) return

    try {
      setBulkLoading(true)
      console.log('Starting bulk enrollment:', { selectedCourse, selectedStudents })
      
      const response = await fetch('/api/enrollments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          studentIds: selectedStudents,
          enrollmentType: 'bulk'
        })
      })

      console.log('Bulk enrollment response status:', response.status)
      const data = await response.json()
      console.log('Bulk enrollment response data:', data)
      
      if (data.error) throw new Error(data.error)

      // Show detailed results
      console.log('Bulk enrollment results:', data.results)
      
      if (data.results && data.results.length > 0) {
        const failedResults = data.results.filter((r: any) => !r.success)
        if (failedResults.length > 0) {
          const failureReasons = failedResults.map((r: any) => `${r.student_id}: ${r.message}`).join('\n')
          toastMessages.enrollment.bulkEnrollmentError(`Some enrollments failed: ${failureReasons}`)
        } else {
          toastMessages.enrollment.bulkEnrollmentSuccess(data.summary.successful)
        }
      } else {
        toastMessages.enrollment.bulkEnrollmentSuccess(data.summary.successful)
      }
      
      setBulkEnrollmentOpen(false)
      setSelectedStudents([])
      setSelectedCourse('')
      fetchEnrollments()
    } catch (error) {
      console.error('Error in bulk enrollment:', error)
      alert(`Failed to enroll students: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setBulkLoading(false)
    }
  }

  const updateEnrollmentStatus = async (enrollmentId: string, status: string) => {
    try {
      console.log('Updating enrollment status:', { enrollmentId, status })
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      console.log('Update response status:', response.status)
      const data = await response.json()
      console.log('Update response data:', data)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
      }
      
      if (data.error) throw new Error(data.error)

      fetchEnrollments()
    } catch (error) {
      console.error('Error updating enrollment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to update enrollment status: ${errorMessage}`)
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = !searchTerm || 
      enrollment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course_title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter
    const matchesCourse = courseFilter === 'all' || enrollment.course_id === courseFilter

    return matchesSearch && matchesStatus && matchesCourse
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return <div className="p-6">Loading enrollment data...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Enrollment Management</h1>
          <p className="text-gray-600">Manage student course enrollments and assignments within your school</p>
        </div>
        
        <div className="flex gap-2">
          {/* <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/test-bulk-enrollment')
                const data = await response.json()
                console.log('Test results:', data)
                alert(`Test completed. Check console for details.\n\nCourses: ${data.courses.count}\nStudents: ${data.students.count}\nEnrollments: ${data.enrollments.count}`)
              } catch (error) {
                console.error('Test error:', error)
                alert('Test failed. Check console for details.')
              }
            }}
          >
            Test System
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/debug-data')
                const data = await response.json()
                console.log('Debug data:', data)
                
                if (data.success) {
                  const { enrollments, students, courses } = data.data
                  alert(`Database Debug Info:\n\n` +
                    `User: ${data.user.full_name} (${data.user.role})\n` +
                    `School ID: ${data.user.school_id}\n\n` +
                    `Enrollments: ${enrollments.count} found\n` +
                    `Students: ${students.count} found\n` +
                    `Courses: ${courses.count} found\n\n` +
                    `Check console for detailed data.`)
                } else {
                  alert(`Debug failed: ${data.error}`)
                }
              } catch (error) {
                console.error('Debug error:', error)
                alert('Debug failed. Check console for details.')
              }
            }}
          >
            Debug Data
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              if (courses.length === 0 || students.length === 0) {
                alert('No courses or students available for testing')
                return
              }
              
              try {
                const testCourse = courses[0]
                const testStudent = students[0]
                
                const response = await fetch('/api/test-simple-enrollment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    courseId: testCourse.id,
                    studentId: testStudent.id
                  })
                })
                
                const data = await response.json()
                console.log('Simple enrollment test results:', data)
                
                if (data.success) {
                  alert(`Simple enrollment test successful!\n\nCourse: ${data.course.title}\nStudent: ${data.student.full_name}`)
                  fetchEnrollments() // Refresh the list
                } else {
                  alert(`Simple enrollment test failed: ${data.error}\n\nDetails: ${data.details}`)
                }
              } catch (error) {
                console.error('Simple enrollment test error:', error)
                alert('Simple enrollment test failed. Check console for details.')
              }
            }}
          >
            Test Simple Enrollment
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch('/api/test-enrollment-update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                })
                const data = await response.json()
                console.log('Enrollment update test results:', data)
                if (data.success) {
                  alert(`Enrollment update test successful!\n\nOriginal Status: ${data.testData.originalStatus}\nNew Status: ${data.testData.newStatus}\nEnrollment ID: ${data.testData.enrollmentId}`)
                } else {
                  alert(`Enrollment update test failed: ${data.error}\n\nDetails: ${data.details}\nSuggestion: ${data.suggestion || 'Check console for details'}`)
                }
              } catch (error) {
                console.error('Enrollment update test error:', error)
                alert('Enrollment update test failed. Check console for details.')
              }
            }}
          >
            Test Enrollment Update
          </Button> */}
          <Dialog open={bulkEnrollmentOpen} onOpenChange={setBulkEnrollmentOpen}>
            <DialogTrigger asChild>
              <Button>Bulk Enroll Students</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Enroll Students</DialogTitle>
              <DialogDescription>
                Select students and a course to enroll them in bulk
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="course-select">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Students</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                  {students.map(student => (
                    <label key={student.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id])
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                          }
                        }}
                      />
                      <span className="text-sm">
                        {student.full_name} ({student.email})
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedStudents.length} students selected
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkEnrollmentOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkEnrollment}
                  disabled={!selectedCourse || selectedStudents.length === 0 || bulkLoading}
                >
                  {bulkLoading ? 'Enrolling...' : `Enroll ${selectedStudents.length} Students`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs defaultValue="enrollments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrollments">All Enrollments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by student name or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-filter">Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enrollments ({filteredEnrollments.length})</CardTitle>
              <CardDescription>
                Manage student course enrollments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEnrollments.length === 0 ? (
                <div key="no-enrollments" className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <div className="h-12 w-12 mx-auto mb-2">
                      <Image 
                        src="/logo.png" 
                        alt="Riven Logo" 
                        width={48} 
                        height={48}
                        className="h-12 w-12"
                      />
                    </div>
                    <h3 className="text-lg font-medium">No Enrollments Found</h3>
                    <p className="text-sm">
                      {enrollments.length === 0 
                        ? "No students are enrolled in any courses yet. Use the 'Bulk Enroll Students' button to get started."
                        : "No enrollments match your current filters. Try adjusting your search criteria."
                      }
                    </p>
                  </div>
                  {enrollments.length === 0 && (
                    <Button key="enroll-button" onClick={() => setBulkEnrollmentOpen(true)}>
                      Enroll Students
                    </Button>
                  )}
                </div>
              ) : (
                <div key="enrollments-list" className="space-y-4">
                  {filteredEnrollments.map(enrollment => (
                  <div key={enrollment.enrollment_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{enrollment.student_name}</h3>
                          <p className="text-sm text-gray-600">{enrollment.student_email}</p>
                        </div>
                        <div>
                          <p className="font-medium">{enrollment.course_title}</p>
                          <p className="text-sm text-gray-600">
                            Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(enrollment.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Select
                        value={enrollment.status}
                        onValueChange={(status) => updateEnrollmentStatus(enrollment.enrollment_id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Students ({students.length})</CardTitle>
              <CardDescription>
                All students in your school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h3 className="font-medium">{student.full_name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    <Badge variant={student.is_active ? "default" : "secondary"}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
