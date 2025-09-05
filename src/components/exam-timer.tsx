'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamTimerProps {
  durationMinutes: number
  startTime: string
  onTimeUp: () => void
  className?: string
}

export function ExamTimer({ durationMinutes, startTime, onTimeUp, className }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isWarning, setIsWarning] = useState(false)
  const [isCritical, setIsCritical] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const start = new Date(startTime).getTime()
      const duration = durationMinutes * 60 * 1000 // Convert to milliseconds
      const now = new Date().getTime()
      const elapsed = now - start
      const remaining = Math.max(0, duration - elapsed)
      
      return Math.floor(remaining / 1000) // Convert to seconds
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      // Set warning states
      const warningTime = durationMinutes * 60 * 0.25 // 25% of total time
      const criticalTime = durationMinutes * 60 * 0.1 // 10% of total time

      setIsWarning(remaining <= warningTime && remaining > criticalTime)
      setIsCritical(remaining <= criticalTime)

      // Auto-submit when time is up
      if (remaining <= 0) {
        onTimeUp()
      }
    }

    // Initial calculation
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [durationMinutes, startTime, onTimeUp])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-2 bg-white shadow-lg',
      isWarning && 'border-yellow-300 bg-yellow-50',
      isCritical && 'border-red-300 bg-red-50 animate-pulse',
      className
    )}>
      {isCritical ? (
        <AlertTriangle className="h-5 w-5 text-red-500" />
      ) : (
        <Clock className={cn(
          'h-5 w-5',
          isWarning ? 'text-yellow-600' : 'text-gray-600'
        )} />
      )}
      <span className={cn(
        'font-mono text-lg font-medium',
        isWarning && !isCritical && 'text-yellow-800',
        isCritical && 'text-red-700'
      )}>
        {formatTime(timeRemaining)}
      </span>
      {isCritical && (
        <span className="text-xs text-red-600 font-medium">Time Running Out!</span>
      )}
    </div>
  )
}
