'use client'

// DashboardLayout is now handled globally in AppLayout
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Users, UserCheck, UserX, MoreVertical, Mail } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function UsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    role: 'student' as 'admin' | 'teacher' | 'student'
  })
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    if (!profile?.school_id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, supabase])

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'teacher') {
      fetchUsers()
    }
  }, [profile, fetchUsers])

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const usersByRole = {
    admin: filteredUsers.filter(u => u.role === 'admin'),
    teacher: filteredUsers.filter(u => u.role === 'teacher'),
    student: filteredUsers.filter(u => u.role === 'student')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
    return (
      <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-500 text-center">
                Only administrators and teachers can access user management.
              </p>
            </CardContent>
          </Card>
        </div>    )
  }

  if (loading) {
    return (
      <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>    )
  }

  return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {profile?.role === 'teacher' ? 'Student Management' : 'User Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {profile?.role === 'teacher' 
                ? 'View and manage your students' 
                : 'Manage teachers, students, and administrators'
              }
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>Invite a new user to your school</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'teacher' | 'student' }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="button">Send Invitation</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue={profile?.role === 'teacher' ? 'student' : 'all'} className="space-y-4">
          <TabsList>
            {profile?.role === 'admin' && (
              <>
                <TabsTrigger value="all">All Users ({filteredUsers.length})</TabsTrigger>
                <TabsTrigger value="admin">Admins ({usersByRole.admin.length})</TabsTrigger>
                <TabsTrigger value="teacher">Teachers ({usersByRole.teacher.length})</TabsTrigger>
              </>
            )}
            <TabsTrigger value="student">Students ({usersByRole.student.length})</TabsTrigger>
          </TabsList>

          {profile?.role === 'admin' && (
            <>
              <TabsContent value="all">
                <UsersList users={filteredUsers} onToggleStatus={toggleUserStatus} getRoleBadgeColor={getRoleBadgeColor} />
              </TabsContent>

              <TabsContent value="admin">
                <UsersList users={usersByRole.admin} onToggleStatus={toggleUserStatus} getRoleBadgeColor={getRoleBadgeColor} />
              </TabsContent>

              <TabsContent value="teacher">
                <UsersList users={usersByRole.teacher} onToggleStatus={toggleUserStatus} getRoleBadgeColor={getRoleBadgeColor} />
              </TabsContent>
            </>
          )}

          <TabsContent value="student">
            <UsersList 
              users={usersByRole.student} 
              onToggleStatus={profile?.role === 'admin' ? toggleUserStatus : undefined} 
              getRoleBadgeColor={getRoleBadgeColor}
              isTeacherView={profile?.role === 'teacher'}
            />
          </TabsContent>
        </Tabs>
      </div>  )
}

function UsersList({ 
  users, 
  onToggleStatus, 
  getRoleBadgeColor,
  isTeacherView = false
}: { 
  users: Profile[]
  onToggleStatus?: (userId: string, currentStatus: boolean) => void
  getRoleBadgeColor: (role: string) => string
  isTeacherView?: boolean
}) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500 text-center">
            No users match your current filters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{user.full_name}</h3>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {!user.is_active && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isTeacherView && onToggleStatus && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus(user.id, user.is_active)}
                  className="gap-1"
                >
                  {user.is_active ? (
                    <>
                      <UserX className="h-3 w-3" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3 w-3" />
                      Activate
                    </>
                  )}
                </Button>
              )}
              
              {isTeacherView && (
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}
              
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
