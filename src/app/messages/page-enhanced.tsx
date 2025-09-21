'use client'

// DashboardLayout is now handled globally in AppLayout
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ChatInterface from '@/components/communication/chat-interface'
import { MessageSquare, Plus, Users } from 'lucide-react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type DatabaseChannel = Database['public']['Tables']['channels']['Row']
type Channel = {
  id: string
  name: string
  is_private: boolean
  course_id?: string
}

export default function MessagesPage() {
  const { profile } = useAuth()
  const { isConnected } = useSocket()
  
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  
  // Create supabase client once and memoize it
  const supabase = useMemo(() => createClient(), [])

  const fetchChannels = useCallback(async () => {
    if (!profile?.school_id) {
      console.log('No school_id found in profile:', profile)
      setLoading(false)
      return
    }

    try {
      console.log('Fetching channels for school:', profile.school_id)
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching channels:', error)
        throw error
      }

      console.log('Fetched channels:', data)
      // Filter out channels with null names and provide default names
      const validChannels: Channel[] = (data || []).map(channel => ({
        id: channel.id,
        name: channel.name || 'Unnamed Channel',
        is_private: channel.is_private,
        course_id: channel.course_id || undefined
      }))
      setChannels(validChannels)
      
      // Auto-select first channel if none selected
      if (validChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(validChannels[0])
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, supabase, selectedChannel])

  useEffect(() => {
    if (profile?.school_id) {
      fetchChannels()
    } else {
      setLoading(false)
    }
  }, [profile?.school_id, fetchChannels])

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim() || !profile?.school_id) return

    try {
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

      if (error) throw error

      console.log('Channel created:', data)
      setChannels(prev => [...prev, data])
      setNewChannelName('')
      setShowCreateChannel(false)
      setSelectedChannel(data)
    } catch (error) {
      console.error('Error creating channel:', error)
    }
  }

  const createGeneralChannel = async () => {
    if (!profile?.school_id) return

    try {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: 'General',
          school_id: profile.school_id,
          created_by: profile.id,
          is_private: false
        })
        .select()
        .single()

      if (error) throw error

      console.log('General channel created:', data)
      setChannels([data])
      setSelectedChannel(data)
    } catch (error) {
      console.error('Error creating general channel:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile?.school_id) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">School Assignment Required</h3>
            <p className="text-gray-600 mb-4">
              You need to be assigned to a school before you can access messages. 
              Your profile shows: {profile?.full_name} ({profile?.role})
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                School ID: {profile?.school_id || 'Not assigned'}
              </p>
              <Button onClick={() => window.location.href = '/profile'}>
                View Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Communicate with your school community</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Channels Sidebar */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Channels</CardTitle>
                {profile?.role === 'admin' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowCreateChannel(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {showCreateChannel && (
                <div className="p-4 border-b">
                  <form onSubmit={createChannel} className="space-y-3">
                    <Input
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="Channel name..."
                      className="text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={!newChannelName.trim()}>
                        Create
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setShowCreateChannel(false)
                          setNewChannelName('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              {channels.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No channels yet</p>
                  {profile?.role === 'admin' && (
                    <Button size="sm" onClick={createGeneralChannel}>
                      Create General Channel
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${
                        selectedChannel?.id === channel.id 
                          ? 'bg-blue-50 border-l-blue-500 shadow-sm' 
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          selectedChannel?.id === channel.id ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm">{channel.name || 'Unnamed Channel'}</span>
                          </div>
                          {channel.is_private && (
                            <span className="text-xs text-gray-500 ml-6">Private</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Chat Interface */}
        <div className="col-span-3">
          <ChatInterface 
            selectedChannel={selectedChannel}
            onChannelSelect={setSelectedChannel}
          />
        </div>
      </div>
    </div>
  )
}
