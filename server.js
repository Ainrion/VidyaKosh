import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join channel room
    socket.on('join-channel', (channelId: string) => {
      socket.join(`channel-${channelId}`)
      console.log(`User ${socket.id} joined channel ${channelId}`)
    })

    // Leave channel room
    socket.on('leave-channel', (channelId: string) => {
      socket.leave(`channel-${channelId}`)
      console.log(`User ${socket.id} left channel ${channelId}`)
    })

    // Handle new messages
    socket.on('send-message', async (data) => {
      try {
        const { channelId, message, userId, userToken } = data
        
        // Verify user authentication with Supabase
        const { data: user, error: authError } = await supabase.auth.getUser(userToken)
        
        if (authError || !user.user || user.user.id !== userId) {
          socket.emit('error', 'Unauthorized')
          return
        }

        // Save message to database
        const { data: savedMessage, error } = await supabase
          .from('messages')
          .insert({
            channel_id: channelId,
            sender_id: userId,
            content: message,
          })
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
          `)
          .single()

        if (error) {
          console.error('Error saving message:', error)
          socket.emit('message-error', 'Failed to save message')
          return
        }

        // Broadcast message to all users in the channel
        io.to(`channel-${channelId}`).emit('new-message', savedMessage)
        
      } catch (error) {
        console.error('Error handling message:', error)
        socket.emit('message-error', 'Internal server error')
      }
    })

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      socket.to(`channel-${data.channelId}`).emit('user-typing', {
        userId: data.userId,
        userName: data.userName,
        channelId: data.channelId
      })
    })

    socket.on('typing-stop', (data) => {
      socket.to(`channel-${data.channelId}`).emit('user-stopped-typing', {
        userId: data.userId,
        channelId: data.channelId
      })
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
