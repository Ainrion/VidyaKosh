'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  Eye, 
  Shield, 
  Timer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface ExamSchedule {
  id: string
  exam_id: string
  exam_title: string
  course_id: string
  course_title: string
  scheduled_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  timezone: string
  max_attempts: number
  proctoring_enabled: boolean
  proctoring_settings: {
    webcam_required: boolean
    screen_sharing: boolean
    tab_switching_detection: boolean
    fullscreen_required: boolean
    audio_monitoring: boolean
    ai_proctoring: boolean
  }
  access_restrictions: {
    ip_whitelist: string[]
    location_restrictions: boolean
    device_restrictions: boolean
  }
  notification_settings: {
    reminder_24h: boolean
    reminder_1h: boolean
    reminder_15min: boolean
  }
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
}

interface ExamSchedulerProps {
  courseId: string
  examId?: string
  onScheduleCreated?: (schedule: ExamSchedule) => void
}

export function ExamScheduler({ courseId, examId, onScheduleCreated }: ExamSchedulerProps) {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [showScheduler, setShowScheduler] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    exam_id: examId || '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    timezone: 'UTC',
    max_attempts: 1,
    proctoring_enabled: false,
    proctoring_settings: {
      webcam_required: false,
      screen_sharing: false,
      tab_switching_detection: true,
      fullscreen_required: true,
      audio_monitoring: false,
      ai_proctoring: false
    },
    access_restrictions: {
      ip_whitelist: [] as string[],
      location_restrictions: false,
      device_restrictions: false
    },
    notification_settings: {
      reminder_24h: true,
      reminder_1h: true,
      reminder_15min: true
    }
  })

  const [newIpAddress, setNewIpAddress] = useState('')

  useEffect(() => {
    // Mock data for demonstration
    const mockSchedules: ExamSchedule[] = [
      {
        id: '1',
        exam_id: 'exam1',
        exam_title: 'Mathematics Midterm',
        course_id: courseId,
        course_title: 'Mathematics 101',
        scheduled_date: '2024-02-15',
        start_time: '10:00',
        end_time: '12:00',
        duration_minutes: 120,
        timezone: 'UTC',
        max_attempts: 1,
        proctoring_enabled: true,
        proctoring_settings: {
          webcam_required: true,
          screen_sharing: true,
          tab_switching_detection: true,
          fullscreen_required: true,
          audio_monitoring: false,
          ai_proctoring: true
        },
        access_restrictions: {
          ip_whitelist: ['192.168.1.0/24', '10.0.0.0/8'],
          location_restrictions: true,
          device_restrictions: false
        },
        notification_settings: {
          reminder_24h: true,
          reminder_1h: true,
          reminder_15min: true
        },
        status: 'scheduled',
        created_by: 'teacher1',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
    setSchedules(mockSchedules)
  }, [courseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.scheduled_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const schedule: ExamSchedule = {
        id: editingSchedule?.id || `schedule_${Date.now()}`,
        exam_id: formData.exam_id,
        exam_title: 'Sample Exam', // This would come from exam data
        course_id: courseId,
        course_title: 'Sample Course', // This would come from course data
        scheduled_date: formData.scheduled_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration_minutes: formData.duration_minutes,
        timezone: formData.timezone,
        max_attempts: formData.max_attempts,
        proctoring_enabled: formData.proctoring_enabled,
        proctoring_settings: formData.proctoring_settings,
        access_restrictions: formData.access_restrictions,
        notification_settings: formData.notification_settings,
        status: 'scheduled',
        created_by: 'current_user', // This would come from auth context
        created_at: new Date().toISOString()
      }

      if (editingSchedule) {
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? schedule : s))
        toast.success('Schedule updated successfully!')
      } else {
        setSchedules(prev => [schedule, ...prev])
        onScheduleCreated?.(schedule)
        toast.success('Exam scheduled successfully!')
      }

      setShowScheduler(false)
      setEditingSchedule(null)
      resetForm()
    } catch (error) {
      toast.error('Failed to schedule exam')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      exam_id: examId || '',
      scheduled_date: '',
      start_time: '',
      end_time: '',
      duration_minutes: 60,
      timezone: 'UTC',
      max_attempts: 1,
      proctoring_enabled: false,
      proctoring_settings: {
        webcam_required: false,
        screen_sharing: false,
        tab_switching_detection: true,
        fullscreen_required: true,
        audio_monitoring: false,
        ai_proctoring: false
      },
      access_restrictions: {
        ip_whitelist: [],
        location_restrictions: false,
        device_restrictions: false
      },
      notification_settings: {
        reminder_24h: true,
        reminder_1h: true,
        reminder_15min: true
      }
    })
  }

  const addIpAddress = () => {
    if (newIpAddress.trim() && !formData.access_restrictions.ip_whitelist.includes(newIpAddress.trim())) {
      setFormData(prev => ({
        ...prev,
        access_restrictions: {
          ...prev.access_restrictions,
          ip_whitelist: [...prev.access_restrictions.ip_whitelist, newIpAddress.trim()]
        }
      }))
      setNewIpAddress('')
    }
  }

  const removeIpAddress = (ip: string) => {
    setFormData(prev => ({
      ...prev,
      access_restrictions: {
        ...prev.access_restrictions,
        ip_whitelist: prev.access_restrictions.ip_whitelist.filter(addr => addr !== ip)
      }
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exam Scheduling</h2>
          <p className="text-gray-600">Schedule and manage exam sessions with proctoring</p>
        </div>
        <Button onClick={() => setShowScheduler(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Exam
        </Button>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{schedule.exam_title}</h3>
                  <p className="text-gray-600">{schedule.course_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSchedule(schedule)
                      setFormData({
                        exam_id: schedule.exam_id,
                        scheduled_date: schedule.scheduled_date,
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        duration_minutes: schedule.duration_minutes,
                        timezone: schedule.timezone,
                        max_attempts: schedule.max_attempts,
                        proctoring_enabled: schedule.proctoring_enabled,
                        proctoring_settings: schedule.proctoring_settings,
                        access_restrictions: schedule.access_restrictions,
                        notification_settings: schedule.notification_settings
                      })
                      setShowScheduler(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {formatDateTime(schedule.scheduled_date, schedule.start_time)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{schedule.duration_minutes} minutes</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{schedule.max_attempts} attempt{schedule.max_attempts !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {schedule.proctoring_enabled && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Proctoring Enabled</span>
                  <div className="flex gap-1">
                    {schedule.proctoring_settings.webcam_required && (
                      <Badge variant="secondary" className="text-xs">Webcam</Badge>
                    )}
                    {schedule.proctoring_settings.screen_sharing && (
                      <Badge variant="secondary" className="text-xs">Screen Share</Badge>
                    )}
                    {schedule.proctoring_settings.ai_proctoring && (
                      <Badge variant="secondary" className="text-xs">AI Proctoring</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingSchedule ? 'Edit Exam Schedule' : 'Schedule New Exam'}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowScheduler(false)
                    setEditingSchedule(null)
                    resetForm()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Schedule Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Schedule Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_date">Date *</Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        value={formData.scheduled_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_attempts">Max Attempts</Label>
                    <Input
                      id="max_attempts"
                      type="number"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                </div>

                {/* Proctoring Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <h4 className="font-medium">Proctoring Settings</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="proctoring_enabled"
                        checked={formData.proctoring_enabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, proctoring_enabled: e.target.checked }))}
                      />
                      <Label htmlFor="proctoring_enabled">Enable Proctoring</Label>
                    </div>

                    {formData.proctoring_enabled && (
                      <div className="ml-6 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="webcam_required"
                                checked={formData.proctoring_settings.webcam_required}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  proctoring_settings: {
                                    ...prev.proctoring_settings,
                                    webcam_required: e.target.checked
                                  }
                                }))}
                              />
                              <Label htmlFor="webcam_required">Require Webcam</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="screen_sharing"
                                checked={formData.proctoring_settings.screen_sharing}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  proctoring_settings: {
                                    ...prev.proctoring_settings,
                                    screen_sharing: e.target.checked
                                  }
                                }))}
                              />
                              <Label htmlFor="screen_sharing">Screen Sharing</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="tab_switching_detection"
                                checked={formData.proctoring_settings.tab_switching_detection}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  proctoring_settings: {
                                    ...prev.proctoring_settings,
                                    tab_switching_detection: e.target.checked
                                  }
                                }))}
                              />
                              <Label htmlFor="tab_switching_detection">Tab Switching Detection</Label>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="fullscreen_required"
                                checked={formData.proctoring_settings.fullscreen_required}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  proctoring_settings: {
                                    ...prev.proctoring_settings,
                                    fullscreen_required: e.target.checked
                                  }
                                }))}
                              />
                              <Label htmlFor="fullscreen_required">Fullscreen Required</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="audio_monitoring"
                                checked={formData.proctoring_settings.audio_monitoring}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  proctoring_settings: {
                                    ...prev.proctoring_settings,
                                    audio_monitoring: e.target.checked
                                  }
                                }))}
                              />
                              <Label htmlFor="audio_monitoring">Audio Monitoring</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ai_proctoring"
                                checked={formData.proctoring_settings.ai_proctoring}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  proctoring_settings: {
                                    ...prev.proctoring_settings,
                                    ai_proctoring: e.target.checked
                                  }
                                }))}
                              />
                              <Label htmlFor="ai_proctoring">AI Proctoring</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Access Restrictions */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <h4 className="font-medium">Access Restrictions</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="location_restrictions"
                        checked={formData.access_restrictions.location_restrictions}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          access_restrictions: {
                            ...prev.access_restrictions,
                            location_restrictions: e.target.checked
                          }
                        }))}
                      />
                      <Label htmlFor="location_restrictions">Location Restrictions</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>IP Whitelist</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newIpAddress}
                          onChange={(e) => setNewIpAddress(e.target.value)}
                          placeholder="Enter IP address or range (e.g., 192.168.1.0/24)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIpAddress())}
                        />
                        <Button type="button" onClick={addIpAddress}>
                          Add
                        </Button>
                      </div>
                      
                      {formData.access_restrictions.ip_whitelist.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.access_restrictions.ip_whitelist.map((ip) => (
                            <Badge key={ip} variant="secondary" className="flex items-center gap-1">
                              {ip}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeIpAddress(ip)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <h4 className="font-medium">Notification Settings</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="reminder_24h"
                        checked={formData.notification_settings.reminder_24h}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notification_settings: {
                            ...prev.notification_settings,
                            reminder_24h: e.target.checked
                          }
                        }))}
                      />
                      <Label htmlFor="reminder_24h">24 hours before</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="reminder_1h"
                        checked={formData.notification_settings.reminder_1h}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notification_settings: {
                            ...prev.notification_settings,
                            reminder_1h: e.target.checked
                          }
                        }))}
                      />
                      <Label htmlFor="reminder_1h">1 hour before</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="reminder_15min"
                        checked={formData.notification_settings.reminder_15min}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          notification_settings: {
                            ...prev.notification_settings,
                            reminder_15min: e.target.checked
                          }
                        }))}
                      />
                      <Label htmlFor="reminder_15min">15 minutes before</Label>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowScheduler(false)
                      setEditingSchedule(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Schedule Exam'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
