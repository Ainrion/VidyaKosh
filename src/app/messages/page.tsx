'use client'

// DashboardLayout is now handled globally in AppLayout
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ChatInterface from '@/components/communication/chat-interface'
import { MessageSquare, Plus, Users, Hash, Search, MoreVertical, Bell, Settings, UserPlus, Archive, Lock, Globe } from 'lucide-react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Channel = Database['public']['Tables']['channels']['Row']

export default function MessagesPage() {
  const { profile } = useAuth()
  const { isConnected } = useSocket()
  
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Create supabase client once and memoize it
  const supabase = useMemo(() => createClient(), [])

  // Filter channels based on search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels
    return channels.filter(channel => 
      (channel.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [channels, searchQuery])

  const fetchChannels = useCallback(async () => {
    if (!profile?.school_id) {
      console.log('No school_id found in profile:', profile)
      setLoading(false)
      return
    }

    try {
      console.log('Fetching channels for school:', profile.school_id)
      
      // First check if messaging tables exist
      const { data: tableStatus, error: statusError } = await supabase
        .rpc('check_messaging_tables')

      if (statusError) {
        console.error('Error checking table status:', statusError)
        setChannels([])
        setLoading(false)
        return
      }

      console.log('Table status:', tableStatus)

      if (!tableStatus?.channels_exists) {
        console.log('Channels table does not exist')
        setChannels([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching channels:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Fetched channels:', data)
      setChannels(data || [])
      
      // Auto-select first channel if none selected - use functional update to avoid dependency
      setSelectedChannel(prev => {
        if (!prev && data && data.length > 0) {
          return data[0]
        }
        return prev
      })
    } catch (error) {
      console.error('Failed to fetch channels:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      setChannels([])
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, supabase])


  useEffect(() => {
    if (profile?.school_id) {
      fetchChannels()
    } else {
      setLoading(false)
    }
  }, [profile?.school_id, fetchChannels])

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim() || !profile?.school_id) {
      console.error('Cannot create channel: Missing channel name or school_id')
      return
    }

    try {
      console.log('Creating channel:', newChannelName.trim(), 'for school:', profile.school_id)

      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: newChannelName.trim(),
          school_id: profile.school_id,
          created_by: profile.id,
          is_private: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating channel:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Channel created successfully:', data)
      setChannels(prev => [...prev, data])
      setNewChannelName('')
      setShowCreateChannel(false)
      setSelectedChannel(data)
    } catch (error) {
      console.error('Error creating channel:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      })
    }
  }

  const createGeneralChannel = async () => {
    if (!profile?.school_id) {
      console.error('Cannot create channel: No school_id in profile')
      return
    }

    try {
      console.log('Creating general channel for school:', profile.school_id)
      
      // First check if user has permissions and get detailed info
      const { data: userInfo, error: userError } = await supabase
        .rpc('get_user_school_info')

      if (userError) {
        console.error('Error getting user info:', userError)
        return
      }

      console.log('User info:', userInfo)

      // Use the database function to create the channel
      const { data: result, error } = await supabase
        .rpc('create_general_channel', { school_uuid: profile.school_id })

      if (error) {
        console.error('Database function error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      console.log('Channel creation result:', result)

      if (result.error) {
        console.error('Channel creation failed:', result.error)
        return
      }

      if (result.success && result.channel) {
        console.log('General channel created successfully:', result.channel)
        setChannels([result.channel])
        setSelectedChannel(result.channel)
      }
    } catch (error) {
      console.error('Error creating general channel:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      })
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-gray-700">Loading messages...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up your workspace</p>
        </div>
      </div>
    )
  }

  if (!profile?.school_id) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-lg mx-auto p-8">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-8">
            <MessageSquare className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            School Assignment Required
          </h3>
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            You need to be assigned to a school before you can access messages. 
            Your profile shows: {profile?.full_name} ({profile?.role})
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">
              School ID: {profile?.school_id || 'Not assigned'}
            </p>
            <Button 
              onClick={() => window.location.href = '/profile'}
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Modern Header */}
      <div className="flex-none bg-white shadow-sm border-b border-gray-100">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Messages</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isConnected 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {isConnected ? 'Online' : 'Connecting...'}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 rounded-xl">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 rounded-xl">
                <Settings className="h-5 w-5 text-gray-600" />
              </Button>
              {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                <Button 
                  onClick={() => setShowCreateChannel(true)}
                  className="h-10 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Channel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Modern Sidebar */}
        <div className={`flex-none bg-white border-r border-gray-100 transition-all duration-300 shadow-sm ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}>
          {!sidebarCollapsed && (
            <div className="h-full flex flex-col">
              {/* Search Section */}
              <div className="p-6 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              {/* Create Channel Form */}
              {showCreateChannel && (
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <form onSubmit={createChannel} className="space-y-4">
                    <div className="flex items-center gap-3 text-sm font-semibold text-indigo-800">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Hash className="h-4 w-4 text-indigo-600" />
                      </div>
                      Create New Channel
                    </div>
                    <Input
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="Enter channel name..."
                      className="h-12 bg-white border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl font-medium"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={!newChannelName.trim()}
                        className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl"
                      >
                        Create Channel
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setShowCreateChannel(false)
                          setNewChannelName('')
                        }}
                        className="h-10 px-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Channels List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-sm font-medium text-gray-600">Loading channels...</p>
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchQuery ? 'No channels found' : 'No channels yet'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                      {searchQuery 
                        ? 'Try adjusting your search terms'
                        : 'Create your first channel to get started'
                      }
                    </p>
                    {!searchQuery && (profile?.role === 'admin' || profile?.role === 'teacher') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateChannel(true)}
                        className="h-10 px-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Channel
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="space-y-2">
                      {filteredChannels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={`w-full text-left p-4 rounded-2xl transition-all duration-200 group ${
                            selectedChannel?.id === channel.id
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-md'
                              : 'hover:bg-gray-50 hover:shadow-sm border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className={`h-3 w-3 rounded-full ${
                                selectedChannel?.id === channel.id ? 'bg-indigo-500' : 'bg-gray-300'
                              }`}></div>
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                                  channel.is_private 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                  {channel.is_private ? (
                                    <Lock className="h-4 w-4" />
                                  ) : (
                                    <Hash className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={`font-semibold text-base truncate block ${
                                    selectedChannel?.id === channel.id ? 'text-indigo-900' : 'text-gray-900'
                                  }`}>
                                    {channel.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <MoreVertical className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    {filteredChannels.length} {filteredChannels.length === 1 ? 'channel' : 'channels'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="h-8 w-8 p-0 hover:bg-gray-200 rounded-lg"
                  >
                    <Archive className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed Sidebar */}
          {sidebarCollapsed && (
            <div className="h-full flex flex-col items-center py-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(false)}
                className="mb-6 h-10 w-10 p-0 hover:bg-gray-100 rounded-xl"
              >
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="flex-1 flex flex-col items-center space-y-3">
                {channels.slice(0, 5).map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedChannel(channel)}
                    className={`h-10 w-10 p-0 rounded-xl ${
                      selectedChannel?.id === channel.id 
                        ? 'bg-indigo-100 text-indigo-600' 
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    {channel.is_private ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Hash className="h-4 w-4" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Chat Interface */}
        <div className="flex-1 min-w-0">
          <ChatInterface 
            selectedChannel={selectedChannel ? {
              ...selectedChannel,
              name: selectedChannel.name || 'Unnamed Channel',
              course_id: selectedChannel.course_id || undefined
            } : null}
            onChannelSelect={(channel) => {
              setSelectedChannel({
                id: channel.id,
                school_id: selectedChannel?.school_id || '',
                course_id: channel.course_id || null,
                name: channel.name,
                is_private: channel.is_private
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}