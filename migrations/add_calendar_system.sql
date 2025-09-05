-- Calendar System for Vidyakosh LMS
-- Run this SQL in your Supabase SQL Editor

-- Calendar Events table - stores all types of calendar events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'assignment', 'holiday', 'meeting', 'class', 'other')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  color TEXT DEFAULT '#3b82f6', -- Default blue color
  
  -- Reference fields (optional, depends on event type)
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  
  -- Visibility and permissions
  is_public BOOLEAN DEFAULT FALSE, -- If true, visible to all school users
  created_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Calendar Event Participants - for targeted events
CREATE TABLE calendar_event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_type TEXT CHECK (participant_type IN ('required', 'optional', 'organizer')) DEFAULT 'required',
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- School Holidays table - for recurring holidays
CREATE TABLE school_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'yearly', 'monthly', etc.
  color TEXT DEFAULT '#dc2626', -- Default red color for holidays
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can view events in their school" ON calendar_events
  FOR SELECT USING (
    -- Public events in user's school
    (is_public = TRUE AND school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )) OR
    -- Events created by the user
    created_by = auth.uid() OR
    -- Events where user is a participant
    id IN (
      SELECT event_id FROM calendar_event_participants 
      WHERE participant_id = auth.uid()
    ) OR
    -- Course-specific events for enrolled students/teachers
    (course_id IS NOT NULL AND course_id IN (
      SELECT course_id FROM enrollments WHERE student_id = auth.uid()
      UNION
      SELECT course_id FROM course_teachers WHERE teacher_id = auth.uid()
    ))
  );

CREATE POLICY "Teachers and admins can create events" ON calendar_events
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Users can update their own events" ON calendar_events
  FOR UPDATE USING (
    created_by = auth.uid() OR
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own events" ON calendar_events
  FOR DELETE USING (
    created_by = auth.uid() OR
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for calendar_event_participants
CREATE POLICY "Users can view event participants" ON calendar_event_participants
  FOR SELECT USING (
    participant_id = auth.uid() OR
    event_id IN (
      SELECT id FROM calendar_events WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Event creators can manage participants" ON calendar_event_participants
  FOR ALL USING (
    event_id IN (
      SELECT id FROM calendar_events WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for school_holidays
CREATE POLICY "Users can view holidays in their school" ON school_holidays
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage holidays" ON school_holidays
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_calendar_events_school_id ON calendar_events(school_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_course_id ON calendar_events(course_id);
CREATE INDEX idx_calendar_event_participants_event_id ON calendar_event_participants(event_id);
CREATE INDEX idx_calendar_event_participants_participant_id ON calendar_event_participants(participant_id);
CREATE INDEX idx_school_holidays_school_id ON school_holidays(school_id);
CREATE INDEX idx_school_holidays_date_range ON school_holidays(start_date, end_date);

-- Function to automatically create calendar events for exams
CREATE OR REPLACE FUNCTION create_exam_calendar_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Create calendar event when exam is published
  IF NEW.is_published = TRUE AND (OLD IS NULL OR OLD.is_published = FALSE) THEN
    INSERT INTO calendar_events (
      school_id,
      title,
      description,
      event_type,
      start_date,
      end_date,
      course_id,
      exam_id,
      color,
      is_public,
      created_by
    )
    SELECT 
      c.school_id,
      'Exam: ' || NEW.title,
      NEW.description,
      'exam',
      COALESCE(NEW.start_time, NEW.created_at),
      COALESCE(NEW.end_time, NEW.start_time + INTERVAL '1 hour' * (NEW.duration_minutes / 60.0)),
      NEW.course_id,
      NEW.id,
      '#ef4444', -- Red color for exams
      TRUE,
      NEW.created_by
    FROM courses c
    WHERE c.id = NEW.course_id;
  END IF;
  
  -- Update calendar event when exam is updated
  IF OLD IS NOT NULL AND NEW.is_published = TRUE THEN
    UPDATE calendar_events
    SET 
      title = 'Exam: ' || NEW.title,
      description = NEW.description,
      start_date = COALESCE(NEW.start_time, NEW.created_at),
      end_date = COALESCE(NEW.end_time, NEW.start_time + INTERVAL '1 hour' * (NEW.duration_minutes / 60.0)),
      updated_at = now()
    WHERE exam_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create calendar events for assignments
CREATE OR REPLACE FUNCTION create_assignment_calendar_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Create calendar event for assignment due date
  IF NEW.due_date IS NOT NULL THEN
    INSERT INTO calendar_events (
      school_id,
      title,
      description,
      event_type,
      start_date,
      end_date,
      course_id,
      assignment_id,
      color,
      is_public,
      created_by
    )
    SELECT 
      c.school_id,
      'Assignment Due: ' || NEW.title,
      NEW.description,
      'assignment',
      NEW.due_date,
      NEW.due_date,
      NEW.course_id,
      NEW.id,
      '#f59e0b', -- Orange color for assignments
      TRUE,
      NEW.created_at::TEXT::UUID -- Assuming created_at stores user ID
    FROM courses c
    WHERE c.id = NEW.course_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Update calendar event when assignment is updated
  IF OLD IS NOT NULL AND NEW.due_date IS NOT NULL THEN
    UPDATE calendar_events
    SET 
      title = 'Assignment Due: ' || NEW.title,
      description = NEW.description,
      start_date = NEW.due_date,
      end_date = NEW.due_date,
      updated_at = now()
    WHERE assignment_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER exam_calendar_event_trigger
  AFTER INSERT OR UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION create_exam_calendar_event();

CREATE TRIGGER assignment_calendar_event_trigger
  AFTER INSERT OR UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION create_assignment_calendar_event();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE school_holidays;
