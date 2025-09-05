'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Plus, Search, Users, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Channel = Database['public']['Tables']['channels']['Row']
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    full_name: string
    avatar_url?: string
  }
}

export default function MessagesPage() {
  const { profile } = useAuth()
  const { 
    isConnected, 
    joinChannel, 
    leaveChannel, 
    sendMessage: socketSendMessage, 
    messages: socketMessages,
    typingUsers,
    startTyping,
    stopTyping 
  } = useSocket()
  
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
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
        .order('name')

      if (error) {
        console.error('Error fetching channels:', error)
        throw error
      }
      
      console.log('Channels fetched:', data)
      setChannels(data || [])
      
      // Auto-select first channel if none selected
      if (data && data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0])
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.school_id, supabase, selectedChannel])

  // Handle channel selection
  useEffect(() => {
    if (selectedChannel) {
      joinChannel(selectedChannel.id)
    }
    return () => {
      if (selectedChannel) {
        leaveChannel(selectedChannel.id)
      }
    }
  }, [selectedChannel, joinChannel, leaveChannel])

  // Fetch channels when profile changes
  useEffect(() => {
    if (profile?.school_id) {
      fetchChannels()
    }
  }, [profile?.school_id, fetchChannels])

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping && selectedChannel) {
      setIsTyping(true)
      startTyping(selectedChannel.id)
      
      // Stop typing after 3 seconds of inactivity
      setTimeout(() => {
        setIsTyping(false)
        stopTyping(selectedChannel.id)
      }, 3000)
    }
  }, [isTyping, selectedChannel, startTyping, stopTyping])

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChannel || !newMessage.trim() || !profile) return

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear immediately for better UX
    setIsTyping(false)
    stopTyping(selectedChannel.id)

    try {
      const success = await socketSendMessage(selectedChannel.id, messageContent)
      if (!success) {
        // Restore message on error
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(messageContent) // Restore message on error
    }
  }, [selectedChannel, newMessage, profile, socketSendMessage, stopTyping])

  const createGeneralChannel = useCallback(async () => {
    if (!profile?.school_id) return

    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          school_id: profile.school_id,
          name: 'General',
          is_private: false
        })

      if (error) throw error
      fetchChannels()
    } catch (error) {
      console.error('Error creating channel:', error)
    }
  }, [profile?.school_id, supabase, fetchChannels])

  const createChannel = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.school_id || !newChannelName.trim()) return

    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          school_id: profile.school_id,
          name: newChannelName.trim(),
          is_private: false
        })

      if (error) throw error
      setNewChannelName('')
      setShowCreateChannel(false)
      fetchChannels()
    } catch (error) {
      console.error('Error creating channel:', error)
    }
  }, [profile?.school_id, newChannelName, supabase, fetchChannels])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-4 gap-6 h-96">
              <div className="bg-gray-200 rounded"></div>
              <div className="col-span-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // If user has no school assigned
  if (!profile?.school_id) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">Communicate with your school community</p>
            </div>
          </div>
          
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
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
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
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          selectedChannel?.id === channel.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{channel.name || 'Unnamed Channel'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Messages Area */}
          <div className="col-span-3">
            <Card className="h-full flex flex-col">
              {selectedChannel ? (
                <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <CardTitle>{selectedChannel.name || 'Unnamed Channel'}</CardTitle>
                  <div className="flex items-center gap-1 ml-auto">
                    {isConnected ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                {Object.keys(typingUsers).length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
              </CardHeader>                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {socketMessages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      socketMessages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {message.sender?.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{message.sender?.full_name}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.sent_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value)
                          handleTyping()
                        }}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={!isConnected}
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || !isConnected}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Select a channel</p>
                    <p>Choose a channel from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
