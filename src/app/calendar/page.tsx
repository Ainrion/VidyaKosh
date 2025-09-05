'use client'

import { useAuth } from '@/hooks/useAuth'
import { CalendarView } from '@/components/calendar-view'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Plus, Users, BookOpen } from 'lucide-react'
import { DashboardLayout } from "@/components/dashboard-layout";

export default function CalendarPage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to view the calendar.</p>
      </div>
    );
  }

  const canCreateEvents = profile.role === 'teacher' || profile.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View upcoming events, exams, assignments, and holidays
            </p>
          </div>
          {canCreateEvents && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Plus className="h-3 w-3" />
                Click on calendar to create events
              </Badge>
            </div>
          )}
        </div>
        {/* Calendar Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Event Types
            </CardTitle>
            <CardDescription>
              Different types of events are color-coded for easy identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm">Exams</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm">Assignments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm">Holidays</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500"></div>
                <span className="text-sm">Meetings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span className="text-sm">Classes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span className="text-sm">Other</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Main Calendar */}
        <Card>
          <CardContent className="p-6">
            <CalendarView 
              height={700}
              canCreateEvents={canCreateEvents}
              showToolbar={true}
            />
          </CardContent>
        </Card>
        {/* Usage Instructions */}
        {canCreateEvents && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                How to Schedule Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">1</div>
                <div>
                  <p className="font-medium">Click on any date or time slot</p>
                  <p className="text-sm text-muted-foreground">This will open the event creation dialog</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">2</div>
                <div>
                  <p className="font-medium">Fill in event details</p>
                  <p className="text-sm text-muted-foreground">Add title, description, location, and choose colors</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">3</div>
                <div>
                  <p className="font-medium">Save the event</p>
                  <p className="text-sm text-muted-foreground">The event will appear on everyone's calendar in your school</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Automatic Events Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Automatic Calendar Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-red-600 mb-2">📝 Exams</h4>
                <p className="text-sm text-muted-foreground">
                  When teachers create exams with specific dates and times, they automatically appear on the calendar
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">📚 Assignments</h4>
                <p className="text-sm text-muted-foreground">
                  Assignment due dates are automatically added to the calendar when assignments are created
                </p>
              </div>
              <div>
                <h4 className="font-medium text-green-600 mb-2">🎉 School Holidays</h4>
                <p className="text-sm text-muted-foreground">
                  School administrators can manage holidays that will appear on everyone's calendar
                </p>
              </div>
              <div>
                <h4 className="font-medium text-purple-600 mb-2">👥 Manual Events</h4>
                <p className="text-sm text-muted-foreground">
                  Teachers and administrators can create meetings, classes, and other custom events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
