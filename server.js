import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.SOCKET_PORT || 3001 // Use environment variable or default to 3001

// Remove Next.js app initialization - we only want Socket.IO server
// const app = next({ dev, hostname, port })
// const handle = app.getRequestHandler()

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Create a simple HTTP server for Socket.IO only
const server = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'Socket.IO server',
      timestamp: new Date().toISOString()
    }))
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Socket.IO server - use WebSocket connection')
  }
})

  // Initialize Socket.IO with better configuration
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Allow all origins in development
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // Store user sessions
  const userSessions = new Map()

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔗 User connected:', socket.id)

    // Handle user authentication
    socket.on('authenticate', (data) => {
      const { userId, userName } = data
      userSessions.set(socket.id, { userId, userName })
      console.log(`👤 User authenticated: ${userName} (${userId})`)
    })

    // Join channel room
    socket.on('join-channel', (channelId) => {
      socket.join(`channel-${channelId}`)
      console.log(`📢 User ${socket.id} joined channel ${channelId}`)
      
      // Notify others in the channel
      const userSession = userSessions.get(socket.id)
      if (userSession) {
        socket.to(`channel-${channelId}`).emit('user-joined', {
          userId: userSession.userId,
          userName: userSession.userName,
          channelId
        })
      }
    })

    // Leave channel room
    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel-${channelId}`)
      console.log(`📤 User ${socket.id} left channel ${channelId}`)
      
      // Notify others in the channel
      const userSession = userSessions.get(socket.id)
      if (userSession) {
        socket.to(`channel-${channelId}`).emit('user-left', {
          userId: userSession.userId,
          userName: userSession.userName,
          channelId
        })
      }
    })

    // Handle blackboard collaboration
    socket.on('join-blackboard', (data) => {
      const { blackboardId, userId, userName } = data
      socket.join(`blackboard-${blackboardId}`)
      console.log(`👤 User ${userName} joined blackboard ${blackboardId}`)
      
      // Notify others in the blackboard
      socket.to(`blackboard-${blackboardId}`).emit('collaborator-joined', {
        userId,
        userName
      })
    })

    socket.on('leave-blackboard', (data) => {
      const { blackboardId, userId, userName } = data
      socket.leave(`blackboard-${blackboardId}`)
      console.log(`👤 User ${userName} left blackboard ${blackboardId}`)
      
      // Notify others in the blackboard
      socket.to(`blackboard-${blackboardId}`).emit('collaborator-left', {
        userId,
        userName
      })
    })

    socket.on('blackboard-drawing', (data) => {
      const { blackboardId, elements, userId, userName } = data
      console.log(`🎨 User ${userName} drawing on blackboard ${blackboardId}`)
      
      // Broadcast to all other users in the blackboard
      socket.to(`blackboard-${blackboardId}`).emit('blackboard-drawing', {
        elements,
        userId,
        userName
      })
    })

    socket.on('blackboard-updated', (data) => {
      const { blackboardId, elements } = data
      console.log(`💾 Blackboard ${blackboardId} updated`)
      
      // Broadcast to all users in the blackboard
      socket.to(`blackboard-${blackboardId}`).emit('blackboard-updated', {
        elements
      })
    })

    // Handle new messages
    socket.on('send-message', async (data) => {
      try {
        const { channelId, message, userId, userToken } = data
        
        console.log(`💬 Message from ${userId} in channel ${channelId}:`, message.substring(0, 50))
        
        // Verify user authentication with Supabase
        const { data: user, error: authError } = await supabase.auth.getUser(userToken)
        
        if (authError || !user.user || user.user.id !== userId) {
          console.error('❌ Authentication failed:', authError?.message)
          socket.emit('message-error', 'Unauthorized')
          return
        }

        // Save message to database
        const { data: savedMessage, error } = await supabase
          .from('messages')
          .insert({
            channel_id: channelId,
            sender_id: userId,
            content: message.trim(),
          })
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name, avatar_url, role)
          `)
          .single()

        if (error) {
          console.error('❌ Error saving message:', error)
          socket.emit('message-error', 'Failed to save message')
          return
        }

        console.log('✅ Message saved successfully:', savedMessage.id)

        // Broadcast message to all users in the channel
        io.to(`channel-${channelId}`).emit('new-message', savedMessage)
        
      } catch (error) {
        console.error('❌ Error handling message:', error)
        socket.emit('message-error', 'Internal server error')
      }
    })

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { channelId, userId, userName } = data
      console.log(`⌨️ ${userName} started typing in channel ${channelId}`)
      
      socket.to(`channel-${channelId}`).emit('user-typing', {
        userId,
        userName,
        channelId
      })
    })

    socket.on('typing-stop', (data) => {
      const { channelId, userId } = data
      console.log(`⏹️ User ${userId} stopped typing in channel ${channelId}`)
      
      socket.to(`channel-${channelId}`).emit('user-stopped-typing', {
        userId,
        channelId
      })
    })

    // Handle message reactions (future feature)
    socket.on('add-reaction', async (data) => {
      const { messageId, emoji, userId } = data
      // Implementation for message reactions
      socket.to(`message-${messageId}`).emit('reaction-added', {
        messageId,
        emoji,
        userId
      })
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 User disconnected:', socket.id, 'Reason:', reason)
      
      // Clean up user session
      const userSession = userSessions.get(socket.id)
      if (userSession) {
        // Notify all channels that user disconnected
        socket.broadcast.emit('user-disconnected', {
          userId: userSession.userId,
          userName: userSession.userName
        })
        userSessions.delete(socket.id)
      }
    })

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error)
    })
  })

  // Health check is already handled in the createServer callback above

  server.listen(port, () => {
    console.log(`🚀 Socket.IO Server ready on http://${hostname}:${port}`)
    console.log(`📊 Environment: ${dev ? 'development' : 'production'}`)
  })
