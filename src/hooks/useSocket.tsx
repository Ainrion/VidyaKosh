'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
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
  socket: Socket | null
  isConnected: boolean
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  sendMessage: (channelId: string, message: string) => Promise<boolean>
  messages: Message[]
  typingUsers: { [key: string]: string }
  startTyping: (channelId: string) => void
  stopTyping: (channelId: string) => void
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({})
  const [currentChannel, setCurrentChannel] = useState<string | null>(null)
  
  const { user, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const socketInitializedRef = useRef(false)

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !profile) {
      console.log('❌ No user or profile, skipping socket connection')
      return
    }

    // Prevent multiple connections
    if (socket || socketInitializedRef.current) {
      console.log('🔗 Socket already exists or initialized, skipping initialization')
      return
    }

    socketInitializedRef.current = true

    console.log('🔗 Initializing Socket.IO connection...')
    setConnectionStatus('connecting')

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    console.log('🔗 Connecting to Socket.IO server:', socketUrl)
    
    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade
      upgrade: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 2000, // Increased delay to prevent rapid reconnections
      reconnectionAttempts: 5, // Reduced attempts to prevent infinite loops
      autoConnect: true
    })

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id)
      setIsConnected(true)
      setConnectionStatus('connected')
      
      // Authenticate user
      socketInstance.emit('authenticate', {
        userId: user.id,
        userName: profile.full_name
      })
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)
      setConnectionStatus('disconnected')
      
      // Auto-reconnect logic - only for server-initiated disconnects
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...')
          if (!socketInstance.connected) {
            socketInstance.connect()
          }
        }, 3000) // Increased delay to prevent rapid reconnections
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', {
        message: error.message,
        stack: error.stack
      })
      setIsConnected(false)
      setConnectionStatus('error')
      
      // Provide user-friendly error messages
      if (error.message.includes('xhr poll error')) {
        console.error('❌ Network connectivity issue - check if server is running')
      } else if (error.message.includes('timeout')) {
        console.error('❌ Connection timeout - server may be overloaded')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('❌ Connection refused - Socket.IO server not running on port 3001')
      }
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`)
      setIsConnected(true)
      setConnectionStatus('connected')
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after maximum attempts')
      setConnectionStatus('error')
    })

    // Message events
    socketInstance.on('new-message', (message: Message) => {
      console.log('📨 New message received:', message.id)
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === message.id)) {
          return prev
        }
        return [...prev, message].sort((a, b) => 
          new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        )
      })
    })

    // Typing indicator events
    socketInstance.on('user-typing', (data) => {
      console.log('⌨️ User typing:', data.userName)
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.userName
      }))
    })

    socketInstance.on('user-stopped-typing', (data) => {
      console.log('⏹️ User stopped typing:', data.userId)
      setTypingUsers(prev => {
        const newTyping = { ...prev }
        delete newTyping[data.userId]
        return newTyping
      })
    })

    // User presence events
    socketInstance.on('user-joined', (data) => {
      console.log('👋 User joined channel:', data.userName)
    })

    socketInstance.on('user-left', (data) => {
      console.log('👋 User left channel:', data.userName)
    })

    // Error events
    socketInstance.on('message-error', (error) => {
      console.error('💬 Message error:', error)
    })

    setSocket(socketInstance)

    return () => {
      console.log('🧹 Cleaning up socket connection')
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socketInstance.disconnect()
      setSocket(null)
      setIsConnected(false)
      setConnectionStatus('disconnected')
      socketInitializedRef.current = false
    }
  }, [user?.id, profile?.id]) // Only depend on IDs to prevent unnecessary reconnections

  // Join channel
  const joinChannel = useCallback(async (channelId: string) => {
    if (!socket || !user || !profile) {
      console.log('❌ Cannot join channel: missing socket, user, or profile')
      return
    }

    console.log('🔗 Joining channel:', channelId)
    
    // Leave current channel first
    if (currentChannel && currentChannel !== channelId) {
      console.log('📤 Leaving current channel:', currentChannel)
      socket.emit('leave-channel', currentChannel)
    }

    // Join new channel
    socket.emit('join-channel', channelId)
    setCurrentChannel(channelId)

    // Fetch existing messages from database
    try {
      console.log('📥 Fetching messages for channel:', channelId)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url, role)
        `)
        .eq('channel_id', channelId)
        .order('sent_at', { ascending: true })
        .limit(50) // Limit to last 50 messages

      if (error) {
        console.error('❌ Error fetching messages:', error)
        throw error
      }

      console.log(`✅ Loaded ${data?.length || 0} messages for channel ${channelId}`)
      setMessages(data || [])
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      setMessages([])
    }
  }, [socket, user, profile, currentChannel, supabase])

  // Send message
  const sendMessage = useCallback(async (channelId: string, content: string): Promise<boolean> => {
    if (!socket || !user || !profile) {
      console.log('❌ Cannot send message: missing socket, user, or profile')
      return false
    }

    if (!content.trim()) {
      console.log('❌ Cannot send empty message')
      return false
    }

    try {
      console.log('💬 Sending message to channel:', channelId)
      
      // Get user token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('❌ No access token available')
        return false
      }

      // Send via Socket.IO
      socket.emit('send-message', {
        channelId,
        message: content.trim(),
        userId: user.id,
        userToken: session.access_token
      })

      console.log('✅ Message sent successfully')
      return true
    } catch (error) {
      console.error('❌ Error sending message:', error)
      return false
    }
  }, [socket, user, profile, supabase])

  // Start typing indicator
  const startTyping = useCallback((channelId: string) => {
    if (!socket || !user || !profile) return

    console.log('⌨️ Starting typing indicator')
    
    socket.emit('typing-start', {
      channelId,
      userId: user.id,
      userName: profile.full_name
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId)
    }, 3000)
  }, [socket, user, profile])

  // Stop typing indicator
  const stopTyping = useCallback((channelId: string) => {
    if (!socket || !user) return

    console.log('⏹️ Stopping typing indicator')
    
    socket.emit('typing-stop', {
      channelId,
      userId: user.id
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [socket, user])

  // Leave channel
  const leaveChannel = useCallback((channelId: string) => {
    if (!socket) return

    console.log('📤 Leaving channel:', channelId)
    socket.emit('leave-channel', channelId)
    setCurrentChannel(null)
    setMessages([])
    setTypingUsers({})
  }, [socket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    joinChannel,
    leaveChannel,
    sendMessage,
    messages,
    typingUsers,
    startTyping,
    stopTyping,
    connectionStatus
  }), [
    socket,
    isConnected,
    joinChannel,
    leaveChannel,
    sendMessage,
    messages,
    typingUsers,
    startTyping,
    stopTyping,
    connectionStatus
  ])

  return (
    <SocketContext.Provider value={contextValue}>
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
