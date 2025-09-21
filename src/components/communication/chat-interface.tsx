'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Wifi, WifiOff, Users, AlertCircle, Crown, BookOpen, ChevronDown, Hash, Lock, MoreHorizontal, Phone, Video, UserPlus, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Channel {
  id: string
  name: string
  is_private: boolean
  course_id?: string
}

interface ChatInterfaceProps {
  selectedChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
}

export default function ChatInterface({ selectedChannel, onChannelSelect }: ChatInterfaceProps) {
  const { profile } = useAuth()
  const { 
    isConnected, 
    connectionStatus,
    messages, 
    typingUsers, 
    sendMessage, 
    startTyping, 
    stopTyping,
    joinChannel,
    leaveChannel
  } = useSocket()

  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollToBottom(false)
  }, [])

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100
    setShowScrollToBottom(!isAtBottom && messages.length > 5)
  }, [messages.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Join channel when selected
  useEffect(() => {
    if (selectedChannel) {
      console.log('🔗 Joining channel from chat interface:', selectedChannel.id)
      joinChannel(selectedChannel.id)
    }

    return () => {
      if (selectedChannel) {
        leaveChannel(selectedChannel.id)
      }
    }
  }, [selectedChannel, joinChannel, leaveChannel])

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!selectedChannel || !profile) return

    if (!isTyping) {
      setIsTyping(true)
      startTyping(selectedChannel.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping(selectedChannel.id)
    }, 2000)
  }, [selectedChannel, profile, isTyping, startTyping, stopTyping])

  // Handle message sending
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedChannel || isSending) return

    setIsSending(true)
    
    try {
      const success = await sendMessage(selectedChannel.id, newMessage.trim())
      
      if (success) {
        setNewMessage('')
        setIsTyping(false)
        if (selectedChannel) {
          stopTyping(selectedChannel.id)
        }
        // Focus back to input
        inputRef.current?.focus()
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }, [newMessage, selectedChannel, isSending, sendMessage, stopTyping])

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    handleTyping()
  }, [handleTyping])

  // Get connection status color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500'
      case 'connecting': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  // Get connection status text
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  // Get role symbol and color
  const getRoleInfo = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { symbol: 'A', icon: Crown, color: 'text-red-500 bg-red-100', label: 'Admin' }
      case 'teacher':
        return { symbol: 'T', icon: BookOpen, color: 'text-blue-500 bg-blue-100', label: 'Teacher' }
      case 'student':
        return { symbol: 'S', icon: BookOpen, color: 'text-green-500 bg-green-100', label: 'Student' }
      default:
        return { symbol: 'U', icon: Users, color: 'text-gray-500 bg-gray-100', label: 'User' }
    }
  }

  // Filter out current user from typing users
  const otherTypingUsers = Object.entries(typingUsers).filter(
    ([userId]) => userId !== profile?.id
  )

  if (!selectedChannel) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-lg mx-auto p-12">
          <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-8 shadow-lg">
            <MessageSquare className="h-16 w-16 text-indigo-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Messages
          </h3>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-md mx-auto">
            Select a channel from the sidebar to start conversations with your school community. 
            Connect with teachers, students, and administrators in real-time.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-500 bg-white px-6 py-3 rounded-full shadow-sm">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span>Ready to connect</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Modern Chat Header */}
      <div className="flex-none border-b border-gray-100 bg-white shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                {selectedChannel.is_private ? (
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center shadow-sm">
                    <Lock className="h-6 w-6 text-red-600" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
                    <Hash className="h-6 w-6 text-indigo-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {selectedChannel.name}
                    {selectedChannel.is_private && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-medium px-3 py-1 rounded-full">
                        Private
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isConnected 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {isConnected ? 'Online' : 'Connecting...'}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 rounded-xl">
                <Phone className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 rounded-xl">
                <Video className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 rounded-xl">
                <UserPlus className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 rounded-xl">
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100">
        <ScrollArea className="h-full" ref={scrollAreaRef} onScroll={handleScroll}>
          <div className="p-8 space-y-8">
            <AnimatePresence>
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === profile?.id
                const messageTime = formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })
                const roleInfo = getRoleInfo(message.sender.role)
                const RoleIcon = roleInfo.icon
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar with Role Symbol */}
                    <div className="flex-shrink-0 relative">
                      <Avatar className="h-12 w-12 shadow-md">
                        <AvatarImage src={message.sender.avatar_url} />
                        <AvatarFallback className={`${roleInfo.color} text-white font-bold text-lg`}>
                          {message.sender.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Role Symbol Badge */}
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${roleInfo.color} flex items-center justify-center border-2 border-white shadow-lg`}>
                        <span className="text-xs font-bold text-white">{roleInfo.symbol}</span>
                      </div>
                    </div>
                    
                    <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      {/* Sender Info */}
                      <div className={`flex items-center gap-3 mb-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-base font-bold ${isOwnMessage ? 'text-indigo-600' : 'text-gray-800'}`}>
                          {isOwnMessage ? 'You' : message.sender.full_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <RoleIcon className={`h-4 w-4 ${roleInfo.color.split(' ')[0]}`} />
                          <Badge className={`text-xs font-medium px-3 py-1 rounded-full ${roleInfo.color}`}>
                            {roleInfo.label}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500 font-medium">{messageTime}</span>
                      </div>
                      
                      {/* Message Bubble */}
                      <div
                        className={`rounded-3xl px-6 py-4 max-w-full break-words shadow-lg ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-lg'
                            : 'bg-white text-gray-900 rounded-bl-lg border-2 border-gray-200'
                        }`}
                      >
                        <p className="text-base whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                      </div>
                      
                      {/* Message Status (for own messages) */}
                      {isOwnMessage && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <span className="font-medium">Sent</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Typing Indicators */}
            <AnimatePresence>
              {otherTypingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 text-sm text-gray-500 pl-4 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200"
                >
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="italic font-medium">
                    {otherTypingUsers.length === 1
                      ? `${otherTypingUsers[0][1]} is typing...`
                      : `${otherTypingUsers.length} people are typing...`
                    }
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollToBottom && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 right-6 z-10"
            >
              <Button
                onClick={scrollToBottom}
                size="sm"
                className="rounded-full w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200"
                title="Scroll to bottom"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Message Input */}
      <div className="flex-none border-t border-gray-100 bg-white shadow-lg">
        <div className="p-6">
          <form onSubmit={handleSendMessage} className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder={
                    isConnected 
                      ? `Message #${selectedChannel.name}...` 
                      : "Waiting for connection..."
                  }
                  disabled={!isConnected || isSending}
                  className="min-h-[56px] pr-24 resize-none border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-2xl bg-gray-50 focus:bg-white transition-all duration-200 text-base font-medium"
                  maxLength={1000}
                />
                
                {/* Character count */}
                {newMessage.length > 800 && (
                  <div className="absolute -top-8 right-0 text-sm text-gray-500 bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-200 font-medium">
                    {1000 - newMessage.length} chars left
                  </div>
                )}

                {/* Typing indicator inside input */}
                {isTyping && (
                  <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Connection status */}
              {!isConnected && (
                <div className="absolute -top-10 left-0 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  <span>Reconnecting...</span>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || !isConnected || isSending}
              className="h-14 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 rounded-2xl shadow-lg hover:shadow-xl font-semibold"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          
          {/* Modern Connection Status Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">{getConnectionStatusText()}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4">
                  <Image 
                    src="/logo.png" 
                    alt="Riven Logo" 
                    width={16} 
                    height={16}
                    className="h-4 w-4"
                  />
                </div>
                <span className="font-medium">Teacher</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-500" />
                <span className="font-medium">Student</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}