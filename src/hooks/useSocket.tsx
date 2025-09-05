'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    full_name: string
    avatar_url?: string
    role: 'admin' | 'teacher' | 'student'
  }
}

interface SocketContextType {
  isConnected: boolean
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  sendMessage: (channelId: string, message: string) => Promise<boolean>
  messages: Message[]
  typingUsers: { [key: string]: string }
  startTyping: (channelId: string) => void
  stopTyping: (channelId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({})
  const [currentChannel, setCurrentChannel] = useState<string | null>(null)
  const { user, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  
  // Use useRef to store subscriptions to avoid dependency issues
  const subscriptionsRef = useRef<{ unsubscribe?: () => void }[]>([])

  // Clean up subscriptions
  const cleanupSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe()
      }
    })
    subscriptionsRef.current = []
  }, []) // No dependencies needed since we use ref

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url, role)
        `)
        .eq('channel_id', channelId)
        .order('sent_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [supabase])

  // Fetch complete message with sender info
  const fetchCompleteMessage = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url, role)
        `)
        .eq('id', messageId)
        .single()

      if (error) throw error
      
      setMessages(prev => {
        // Check if message already exists
        const existingIndex = prev.findIndex(msg => msg.id === messageId)
        if (existingIndex >= 0) {
          // Update existing message
          const updated = [...prev]
          updated[existingIndex] = data
          return updated
        } else {
          // Add new message in correct chronological order
          const newMessages = [...prev, data]
          return newMessages.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
        }
      })
    } catch (error) {
      console.error('Error fetching complete message:', error)
    }
  }, [supabase])

  // Leave channel function
  const leaveChannel = useCallback((channelId: string) => {
    if (currentChannel === channelId) {
      cleanupSubscriptions()
      setCurrentChannel(null)
      setMessages([])
      setTypingUsers({})
      setIsConnected(false)
    }
  }, [currentChannel, cleanupSubscriptions])

  // Join channel function
  const joinChannel = useCallback((channelId: string) => {
    if (!user || currentChannel === channelId) return

    // Leave current channel first
    if (currentChannel) {
      leaveChannel(currentChannel)
    }

    setCurrentChannel(channelId)
    
    // Fetch existing messages
    fetchMessages(channelId)

    // Subscribe to real-time messages
    const messageSubscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload: { new: { id: string } }) => {
          console.log('New message received:', payload)
          const newMessage = payload.new
          // Immediately fetch complete message with sender info instead of showing placeholder
          fetchCompleteMessage(newMessage.id)
        }
      )
      .subscribe((status: string) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          console.log('Successfully subscribed to channel:', channelId)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          console.error('Channel subscription error for:', channelId)
        }
      })

    subscriptionsRef.current.push(messageSubscription)
  }, [user, currentChannel, supabase, fetchMessages, fetchCompleteMessage, leaveChannel])

  // Send message function
  const sendMessage = useCallback(async (channelId: string, message: string): Promise<boolean> => {
    if (!user || !profile) return false

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender_id: user.id,
          content: message.trim(),
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }, [user, profile, supabase])

  // Typing indicators (simplified without real-time broadcasting)
  const startTyping = useCallback(() => {
    if (profile) {
      setTypingUsers(prev => ({
        ...prev,
        [user?.id || '']: profile.full_name
      }))
    }
  }, [user, profile])

  const stopTyping = useCallback(() => {
    setTypingUsers(prev => {
      const newTyping = { ...prev }
      delete newTyping[user?.id || '']
      return newTyping
    })
  }, [user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions()
    }
  }, [cleanupSubscriptions])

  return (
    <SocketContext.Provider value={{
      isConnected,
      joinChannel,
      leaveChannel,
      sendMessage,
      messages,
      typingUsers,
      startTyping,
      stopTyping,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
