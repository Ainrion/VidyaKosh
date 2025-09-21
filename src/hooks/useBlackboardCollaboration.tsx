'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface DrawElement {
  type: 'pen' | 'rectangle' | 'circle' | 'text'
  points: { x: number; y: number }[]
  color: string
  strokeWidth: number
  text?: string
  id: string
  userId?: string
  userName?: string
}

interface BlackboardCollaborationProps {
  blackboardId: string
  onElementsChange?: (elements: DrawElement[]) => void
}

export function useBlackboardCollaboration({ 
  blackboardId, 
  onElementsChange 
}: BlackboardCollaborationProps) {
  const { socket, isConnected } = useSocket()
  const { profile } = useAuth()
  const supabase = createClient()
  const [elements, setElements] = useState<DrawElement[]>([])
  const [collaborators, setCollaborators] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Load initial blackboard data
  useEffect(() => {
    const loadBlackboard = async () => {
      try {
        const { data, error } = await supabase
          .from('blackboards')
          .select('board_state')
          .eq('id', blackboardId)
          .single()

        if (error) {
          console.error('Error loading blackboard:', error)
          return
        }

        if (data?.board_state?.elements) {
          setElements(data.board_state.elements)
          onElementsChange?.(data.board_state.elements)
        }
      } catch (error) {
        console.error('Error loading blackboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (blackboardId) {
      loadBlackboard()
    }
  }, [blackboardId, onElementsChange, supabase])

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !blackboardId) return

    const roomName = `blackboard-${blackboardId}`

    // Join blackboard room
    socket.emit('join-blackboard', { blackboardId, userId: profile?.id, userName: profile?.full_name })

    // Listen for drawing events
    const handleDrawing = (data: { elements: DrawElement[], userId: string, userName: string }) => {
      if (data.userId !== profile?.id) {
        setElements(data.elements)
        onElementsChange?.(data.elements)
      }
    }

    // Listen for collaborator join/leave
    const handleCollaboratorJoin = (data: { userId: string, userName: string }) => {
      setCollaborators(prev => new Set([...prev, data.userName]))
    }

    const handleCollaboratorLeave = (data: { userId: string, userName: string }) => {
      setCollaborators(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userName)
        return newSet
      })
    }

    // Listen for real-time updates
    const handleBlackboardUpdate = (data: { elements: DrawElement[] }) => {
      setElements(data.elements)
      onElementsChange?.(data.elements)
    }

    socket.on('blackboard-drawing', handleDrawing)
    socket.on('collaborator-joined', handleCollaboratorJoin)
    socket.on('collaborator-left', handleCollaboratorLeave)
    socket.on('blackboard-updated', handleBlackboardUpdate)

    return () => {
      socket.emit('leave-blackboard', { blackboardId })
      socket.off('blackboard-drawing', handleDrawing)
      socket.off('collaborator-joined', handleCollaboratorJoin)
      socket.off('collaborator-left', handleCollaboratorLeave)
      socket.off('blackboard-updated', handleBlackboardUpdate)
    }
  }, [socket, isConnected, blackboardId, profile, onElementsChange])

  // Broadcast drawing changes
  const broadcastDrawing = useCallback((newElements: DrawElement[]) => {
    if (!socket || !isConnected) return

    socket.emit('blackboard-drawing', {
      blackboardId,
      elements: newElements,
      userId: profile?.id,
      userName: profile?.full_name
    })
  }, [socket, isConnected, blackboardId, profile])

  // Save to database
  const saveToDatabase = useCallback(async (elementsToSave: DrawElement[]) => {
    try {
      const { error } = await supabase
        .from('blackboards')
        .update({
          board_state: { elements: elementsToSave },
          updated_at: new Date().toISOString()
        })
        .eq('id', blackboardId)

      if (error) {
        console.error('Error saving blackboard:', error)
        return false
      }

      // Broadcast the update to all collaborators
      if (socket && isConnected) {
        socket.emit('blackboard-updated', {
          blackboardId,
          elements: elementsToSave
        })
      }

      return true
    } catch (error) {
      console.error('Error saving blackboard:', error)
      return false
    }
  }, [blackboardId, supabase, socket, isConnected])

  // Update elements and broadcast
  const updateElements = useCallback((newElements: DrawElement[]) => {
    setElements(newElements)
    broadcastDrawing(newElements)
  }, [broadcastDrawing])

  return {
    elements,
    collaborators: Array.from(collaborators),
    isLoading,
    isConnected,
    updateElements,
    saveToDatabase,
    broadcastDrawing
  }
}
