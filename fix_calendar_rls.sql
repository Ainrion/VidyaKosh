-- Fix RLS policies for calendar_events table to ensure events can be created
-- Run this in your Supabase SQL Editor

-- First, let's check if the calendar_events table exists
SELECT 'Checking if calendar_events table exists...' as info;

-- Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'assignment', 'holiday', 'meeting', 'class', 'other')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  color TEXT DEFAULT '#3b82f6',
  
  -- Reference fields (optional, depends on event type)
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  
  -- Visibility and permissions
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create school_holidays table if it doesn't exist
CREATE TABLE IF NOT EXISTS school_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  color TEXT DEFAULT '#dc2626',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view events in their school" ON calendar_events;
DROP POLICY IF EXISTS "Teachers and admins can create events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON calendar_events;
DROP POLICY IF EXISTS "Public calendar access" ON calendar_events;

-- Enable RLS on calendar_events table
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to view calendar events
CREATE POLICY "Authenticated users can view calendar events" ON calendar_events
FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for calendar event creation
CREATE POLICY "Teachers and admins can create calendar events" ON calendar_events
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'teacher')
    )
  )
);

-- Create policy for calendar event updates
CREATE POLICY "Event creators and admins can update calendar events" ON calendar_events
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Create policy for calendar event deletion
CREATE POLICY "Event creators and admins can delete calendar events" ON calendar_events
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Enable RLS on school_holidays table
ALTER TABLE school_holidays ENABLE ROW LEVEL SECURITY;

-- Create policies for school_holidays
CREATE POLICY "Authenticated users can view holidays" ON school_holidays
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage holidays" ON school_holidays
FOR ALL USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Grant necessary permissions
GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON school_holidays TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_school_id ON calendar_events(school_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_school_holidays_school_id ON school_holidays(school_id);
CREATE INDEX IF NOT EXISTS idx_school_holidays_date_range ON school_holidays(start_date, end_date);

-- Verify the policies were created
SELECT 'Created policies for calendar_events:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'calendar_events';

SELECT 'Created policies for school_holidays:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'school_holidays';

-- Success message
SELECT '✅ Calendar RLS policies fixed successfully!' as status;
SELECT 'All authenticated users can now view calendar events.' as message;
SELECT 'Teachers and admins can create/update/delete calendar events.' as details;
SELECT 'Admins can manage school holidays.' as holiday_details;
