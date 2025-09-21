'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Views, View, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Book, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  event_type: 'exam' | 'assignment' | 'holiday' | 'meeting' | 'class' | 'other'
  description?: string
  location?: string
  color: string
  course_id?: string
  exam_id?: string
  assignment_id?: string
  is_public: boolean
  course?: {
    title: string
  }
}

// Color mapping for different event types
const EVENT_TYPE_COLORS = {
  exam: '#ef4444',        // red - important/exam
  assignment: '#f97316',  // orange - deadline/assignment
  holiday: '#10b981',     // green - holiday/success
  meeting: '#3b82f6',     // blue - meeting/general
  class: '#8b5cf6',       // purple - class/training
  other: '#6b7280'        // gray - other/neutral
} as const

// Event type descriptions
const EVENT_TYPE_DESCRIPTIONS = {
  exam: '📚 Exam - Red (Important academic events)',
  assignment: '📝 Assignment - Orange (Deadlines and submissions)',
  holiday: '🎉 Holiday - Green (School breaks and celebrations)',
  meeting: '📋 Meeting - Blue (Staff meetings and discussions)',
  class: '🎓 Class - Purple (Regular classes and training)',
  other: '📌 Other - Gray (Miscellaneous events)'
} as const

interface CalendarViewProps {
  height?: number
  defaultView?: View
  showToolbar?: boolean
  className?: string
  canCreateEvents?: boolean // New prop to control event creation
}

export function CalendarView({ 
  height = 600, 
  defaultView = Views.MONTH, 
  showToolbar = true,
  className,
  canCreateEvents = false // Default to false for read-only calendars
}: CalendarViewProps) {
  const { profile } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>(defaultView)
  const [date, setDate] = useState(new Date())
  const [newEvent, setNewEvent] = useState<{
    title: string
    description: string
    start: Date
    end: Date
    allDay: boolean
    location: string
    eventType: keyof typeof EVENT_TYPE_COLORS
    color: typeof EVENT_TYPE_COLORS[keyof typeof EVENT_TYPE_COLORS]
  }>({
    title: '',
    description: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    location: '',
    eventType: 'other',
    color: EVENT_TYPE_COLORS.other
  })

  const supabase = createClient()

  const fetchCalendarEvents = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch calendar events
      const { data: calendarEvents, error: calendarError } = await supabase
        .from('calendar_events')
        .select(`*, courses (title)`)
        .order('start_date', { ascending: true })

      if (calendarError) {
        console.error('Supabase calendar_events error:', calendarError)
        setEvents([])
        return
      }

      // Fetch holidays
      const { data: holidays, error: holidaysError } = await supabase
        .from('school_holidays')
        .select('*')
        .order('start_date', { ascending: true })

      if (holidaysError) {
        console.error('Supabase school_holidays error:', holidaysError)
        setEvents([])
        return
      }

      if (!calendarEvents && !holidays) {
        console.warn('No calendar events or holidays found.')
        setEvents([])
        return
      }

      // Transform events
      const transformedEvents: CalendarEvent[] = [
        ...(calendarEvents || []).map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_date),
          end: event.end_date ? new Date(event.end_date) : new Date(event.start_date),
          allDay: event.all_day,
          event_type: event.event_type,
          description: event.description,
          location: event.location,
          color: event.color,
          course_id: event.course_id,
          exam_id: event.exam_id,
          assignment_id: event.assignment_id,
          is_public: event.is_public,
          course: event.courses
        })),
        ...(holidays || []).map(holiday => ({
          id: holiday.id,
          title: holiday.name,
          start: new Date(holiday.start_date),
          end: new Date(holiday.end_date),
          allDay: true,
          event_type: 'holiday' as const,
          description: holiday.description,
          color: holiday.color,
          is_public: true
        }))
      ]
      setEvents(transformedEvents)
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (profile) {
      fetchCalendarEvents()
    }
  }, [profile, fetchCalendarEvents])

  const createEvent = async () => {
    if (!profile?.school_id || !newEvent.title.trim()) return

    // Validation
    if (newEvent.end <= newEvent.start) {
      alert('End time must be after start time')
      return
    }

    try {
      // Use bypass API to create event
      const response = await fetch('/api/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: profile.school_id,
          title: newEvent.title,
          description: newEvent.description || null,
          event_type: newEvent.eventType,
          start_date: newEvent.start.toISOString(),
          end_date: newEvent.end.toISOString(),
          all_day: newEvent.allDay,
          location: newEvent.location || null,
          color: newEvent.color,
          is_public: true,
          created_by: profile.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error creating event:', data)
        alert(`Failed to create event: ${data.error}`)
        return
      }

      // Reset form and close dialog
      setNewEvent({
        title: '',
        description: '',
        start: new Date(),
        end: moment().add(1, 'hour').toDate(),
        allDay: false,
        location: '',
        eventType: 'other',
        color: '#6b7280'
      })
      setShowCreateDialog(false)
      
      // Refresh events
      fetchCalendarEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    }
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!canCreateEvents) return
    
    const isAllDay = moment(end).diff(moment(start), 'hours') >= 24
    const defaultEnd = isAllDay ? end : moment(start).add(1, 'hour').toDate()
    
    setNewEvent(prev => ({
      ...prev,
      start,
      end: defaultEnd,
      allDay: isAllDay
    }))
    setShowCreateDialog(true)
  }

  const handleDateTimeChange = (field: 'start' | 'end', value: string) => {
    const newDate = new Date(value)
    
    setNewEvent(prev => {
      const updated = { ...prev, [field]: newDate }
      
      // Ensure end is always after start
      if (field === 'start' && newDate >= prev.end) {
        updated.end = moment(newDate).add(1, 'hour').toDate()
      } else if (field === 'end' && newDate <= prev.start) {
        updated.start = moment(newDate).subtract(1, 'hour').toDate()
      }
      
      return updated
    })
  }

  const handleAllDayToggle = (checked: boolean) => {
    setNewEvent(prev => {
      if (checked) {
        // Set to full day
        const start = moment(prev.start).startOf('day').toDate()
        const end = moment(prev.start).endOf('day').toDate()
        return { ...prev, allDay: true, start, end }
      } else {
        // Set to 1-hour event starting at current time or 9 AM
        const now = new Date()
        const start = moment(prev.start).hour(now.getHours() || 9).minute(0).second(0).toDate()
        const end = moment(start).add(1, 'hour').toDate()
        return { ...prev, allDay: false, start, end }
      }
    })
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderColor: event.color,
        color: '#fff',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <CalendarIcon className="h-4 w-4" />
      case 'assignment':
        return <Book className="h-4 w-4" />
      case 'holiday':
        return <CalendarIcon className="h-4 w-4" />
      case 'meeting':
        return <Users className="h-4 w-4" />
      case 'class':
        return <Clock className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getEventTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'exam':
        return 'destructive'
      case 'assignment':
        return 'default'
      case 'holiday':
        return 'secondary'
      case 'meeting':
        return 'outline'
      case 'class':
        return 'default'
      default:
        return 'outline'
    }
  }

  // Custom components for react-big-calendar
  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center gap-1 text-xs">
      {getEventTypeIcon(event.event_type)}
      <span className="truncate">{event.title}</span>
    </div>
  )

  const CustomToolbar = (toolbarProps: any) => {
    if (!showToolbar) return null

    const { label, onNavigate, onView } = toolbarProps

    return (
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onNavigate('PREV')}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={() => onNavigate('TODAY')}
            variant="outline"
            size="sm"
          >
            Today
          </Button>
          <Button
            onClick={() => onNavigate('NEXT')}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
        
        <h2 className="text-lg font-semibold">{label}</h2>
        
        <div className="flex gap-1">
          {['month', 'week', 'day'].map((viewName) => (
            <Button
              key={viewName}
              onClick={() => onView(viewName)}
              variant={view === viewName ? "default" : "outline"}
              size="sm"
              className="capitalize"
            >
              {viewName}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return events
      .filter(event => {
        const eventDate = new Date(event.start!)
        return eventDate >= now && eventDate <= nextWeek
      })
      .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime())
      .slice(0, 5)
  }, [events])

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card className="p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={(event) => {
            setSelectedEvent(event)
          }}
          onSelectSlot={handleSelectSlot}
          selectable={canCreateEvents}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          step={30}
          showMultiDayTimes
          popup
        />
      </Card>

      {/* Upcoming Events Sidebar */}
      {upcomingEvents.length > 0 && (
        <Card className="mt-4 p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Events
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <div 
                  className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getEventTypeBadgeVariant(event.event_type)}>
                      {event.event_type}
                    </Badge>
                    {event.course && (
                      <span className="text-xs text-gray-500">{event.course.title}</span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {moment(event.start).format('MMM DD, YYYY - h:mm A')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getEventTypeIcon(selectedEvent.event_type)}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getEventTypeBadgeVariant(selectedEvent.event_type)}>
                  {selectedEvent.event_type}
                </Badge>
                {selectedEvent.course && (
                  <Badge variant="outline">{selectedEvent.course.title}</Badge>
                )}
              </div>

              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-1">Date & Time</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {moment(selectedEvent.start).format('MMM DD, YYYY')}
                    {!selectedEvent.allDay && (
                      <> at {moment(selectedEvent.start).format('h:mm A')}</>
                    )}
                    {selectedEvent.end && !selectedEvent.allDay && (
                      <> - {moment(selectedEvent.end).format('h:mm A')}</>
                    )}
                  </span>
                </div>
              </div>

              {selectedEvent.location && (
                <div>
                  <h4 className="font-medium mb-1">Location</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedEvent.exam_id && (
                  <Button size="sm" asChild>
                    <a href={`/exams/${selectedEvent.exam_id}/take`}>
                      Take Exam
                    </a>
                  </Button>
                )}
                {selectedEvent.assignment_id && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/assignments/${selectedEvent.assignment_id}`}>
                      View Assignment
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Event
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <select
                id="eventType"
                value={newEvent.eventType}
                onChange={(e) => {
                  const eventType = e.target.value as keyof typeof EVENT_TYPE_COLORS
                  setNewEvent(prev => ({ 
                    ...prev, 
                    eventType,
                     color: EVENT_TYPE_COLORS[eventType] || '#6b7280'
                  }))
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="meeting">📋 Meeting - Blue</option>
                <option value="class">🎓 Class - Purple</option>
                <option value="exam">📚 Exam - Red</option>
                <option value="assignment">📝 Assignment - Orange</option>
                <option value="holiday">🎉 Holiday - Green</option>
                <option value="other">📌 Other - Gray</option>
              </select>
              <div className="text-xs text-muted-foreground mt-1">
                Selecting an event type will automatically suggest an appropriate color
              </div>
            </div>

            {/* Color system explanation */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-2">🎨 Color System Guide:</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• <strong>Red</strong> - Exams and important academic events</div>
                <div>• <strong>Orange</strong> - Assignments, deadlines, and submissions</div>
                <div>• <strong>Green</strong> - Holidays, breaks, and celebrations</div>
                <div>• <strong>Blue</strong> - Meetings, general events, and discussions</div>
                <div>• <strong>Purple</strong> - Classes, training sessions, and workshops</div>
                <div>• <strong>Gray</strong> - Other miscellaneous events</div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.allDay}
                  onChange={(e) => handleAllDayToggle(e.target.checked)}
                />
                <Label htmlFor="allDay">All Day Event</Label>
              </div>
            </div>

            {newEvent.allDay ? (
              // All-day event: only show date inputs
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={moment(newEvent.start).format('YYYY-MM-DD')}
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      setNewEvent(prev => ({
                        ...prev,
                        start: moment(date).startOf('day').toDate(),
                        end: moment(date).endOf('day').toDate()
                      }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={moment(newEvent.end).format('YYYY-MM-DD')}
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      setNewEvent(prev => ({
                        ...prev,
                        end: moment(date).endOf('day').toDate()
                      }))
                    }}
                  />
                </div>
              </div>
            ) : (
              // Timed event: show date and time inputs
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={moment(newEvent.start).format('YYYY-MM-DD')}
                      onChange={(e) => {
                        const newDate = moment(e.target.value)
                          .hour(moment(newEvent.start).hour())
                          .minute(moment(newEvent.start).minute())
                          .toDate()
                        handleDateTimeChange('start', newDate.toISOString())
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={moment(newEvent.start).format('HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':')
                        const newDate = moment(newEvent.start)
                          .hour(parseInt(hours))
                          .minute(parseInt(minutes))
                          .toDate()
                        handleDateTimeChange('start', newDate.toISOString())
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={moment(newEvent.end).format('YYYY-MM-DD')}
                      onChange={(e) => {
                        const newDate = moment(e.target.value)
                          .hour(moment(newEvent.end).hour())
                          .minute(moment(newEvent.end).minute())
                          .toDate()
                        handleDateTimeChange('end', newDate.toISOString())
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={moment(newEvent.end).format('HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':')
                        const newDate = moment(newEvent.end)
                          .hour(parseInt(hours))
                          .minute(parseInt(minutes))
                          .toDate()
                        handleDateTimeChange('end', newDate.toISOString())
                      }}
                    />
                  </div>
                </div>
                
                {/* Duration indicator and quick presets */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Duration: {moment(newEvent.end).diff(moment(newEvent.start), 'minutes')} minutes
                    ({moment.duration(moment(newEvent.end).diff(moment(newEvent.start))).humanize()})
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEnd = moment(newEvent.start).add(30, 'minutes').toDate()
                        setNewEvent(prev => ({ ...prev, end: newEnd }))
                      }}
                    >
                      30m
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEnd = moment(newEvent.start).add(1, 'hour').toDate()
                        setNewEvent(prev => ({ ...prev, end: newEnd }))
                      }}
                    >
                      1h
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEnd = moment(newEvent.start).add(1.5, 'hours').toDate()
                        setNewEvent(prev => ({ ...prev, end: newEnd }))
                      }}
                    >
                      1.5h
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEnd = moment(newEvent.start).add(2, 'hours').toDate()
                        setNewEvent(prev => ({ ...prev, end: newEnd }))
                      }}
                    >
                      2h
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event location (optional)"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="color">Event Color</Label>
              <div className="space-y-3">
                {/* Event type color suggestions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Suggested Colors by Event Type:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span>📋 Meeting - Blue</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                      <div className="w-4 h-4 rounded bg-purple-500"></div>
                      <span>🎓 Class - Purple</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                      <div className="w-4 h-4 rounded bg-orange-500"></div>
                      <span>📝 Assignment - Orange</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span>📚 Exam - Red</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span>🎉 Holiday - Green</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className="w-4 h-4 rounded bg-gray-500"></div>
                      <span>📌 Other - Gray</span>
                    </div>
                  </div>
                </div>

                {/* Quick color presets with descriptions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Quick Color Selection:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { color: '#3b82f6', label: 'Blue', description: 'Meetings, General' },
                      { color: '#8b5cf6', label: 'Purple', description: 'Classes, Training' },
                      { color: '#f97316', label: 'Orange', description: 'Assignments, Deadlines' },
                      { color: '#ef4444', label: 'Red', description: 'Exams, Important' },
                      { color: '#10b981', label: 'Green', description: 'Holidays, Success' },
                      { color: '#6b7280', label: 'Gray', description: 'Other, Neutral' }
                    ].map(({ color, label, description }) => (
                      <button
                        key={color}
                        type="button"
                        className={`p-2 rounded border-2 text-left transition-colors ${
                          newEvent.color === color 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setNewEvent(prev => ({ ...prev, color: color as typeof EVENT_TYPE_COLORS[keyof typeof EVENT_TYPE_COLORS] }))}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        <div className="text-xs text-gray-600">{description}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Custom color picker */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Custom Color:</div>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      value={newEvent.color}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, color: e.target.value as typeof EVENT_TYPE_COLORS[keyof typeof EVENT_TYPE_COLORS] }))}
                      className="w-16 h-8"
                    />
                    <span className="text-sm text-muted-foreground">Hex: {newEvent.color}</span>
                  </div>
                </div>

                {/* Current color preview */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Selected Color Preview:</div>
                  <div className="flex items-center gap-3 p-3 rounded border" style={{ backgroundColor: `${newEvent.color}15` }}>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: newEvent.color }}
                    />
                    <div>
                      <div className="font-medium text-sm">Sample Event</div>
                      <div className="text-xs text-gray-600">This is how your event will appear</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={createEvent}
                disabled={!newEvent.title.trim()}
              >
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
