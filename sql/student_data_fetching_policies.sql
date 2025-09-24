-- Additional RLS policies for student data fetching

-- Enable RLS on enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Allow students to view their own enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
FOR SELECT USING (student_id = auth.uid());

-- Allow teachers to view enrollments for their courses
CREATE POLICY "Teachers can view course enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Allow admins to view all enrollments in their school
CREATE POLICY "Admins can view school enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id IN (
      SELECT school_id FROM profiles student_profile
      WHERE student_profile.id = enrollments.student_id
    )
  )
);

-- Allow students to enroll in courses
CREATE POLICY "Students can create enrollments" ON enrollments
FOR INSERT WITH CHECK (student_id = auth.uid());

-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow students to view assignments for courses they're enrolled in
CREATE POLICY "Students can view enrolled course assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = assignments.course_id
    AND enrollments.student_id = auth.uid()
  )
);

-- Allow teachers to view assignments for their courses
CREATE POLICY "Teachers can view own course assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = assignments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Allow teachers to manage assignments for their courses
CREATE POLICY "Teachers can manage own course assignments" ON assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = assignments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Allow admins to view all assignments in their school
CREATE POLICY "Admins can view school assignments" ON assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile, courses
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND courses.id = assignments.course_id
    AND courses.school_id = admin_profile.school_id
  )
);

-- Enable RLS on assignment_submissions table
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Allow students to view their own submissions
CREATE POLICY "Students can view own submissions" ON assignment_submissions
FOR SELECT USING (student_id = auth.uid());

-- Allow students to create their own submissions
CREATE POLICY "Students can create own submissions" ON assignment_submissions
FOR INSERT WITH CHECK (student_id = auth.uid());

-- Allow students to update their own submissions (before deadline)
CREATE POLICY "Students can update own submissions" ON assignment_submissions
FOR UPDATE USING (student_id = auth.uid());

-- Allow teachers to view submissions for their course assignments
CREATE POLICY "Teachers can view course submissions" ON assignment_submissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM assignments, courses
    WHERE assignments.id = assignment_submissions.assignment_id
    AND courses.id = assignments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Allow teachers to update submissions (for grading)
CREATE POLICY "Teachers can grade submissions" ON assignment_submissions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM assignments, courses
    WHERE assignments.id = assignment_submissions.assignment_id
    AND courses.id = assignments.course_id
    AND courses.created_by = auth.uid()
  )
);

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Allow all users to view courses in their school
CREATE POLICY "Users can view school courses" ON courses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.school_id = courses.school_id
  )
);

-- Allow teachers to manage their own courses
CREATE POLICY "Teachers can manage own courses" ON courses
FOR ALL USING (created_by = auth.uid());

-- Allow admins to manage all courses in their school
CREATE POLICY "Admins can manage school courses" ON courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id = courses.school_id
  )
);

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view messages in channels they have access to
CREATE POLICY "Users can view accessible messages" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channels
    WHERE channels.id = messages.channel_id
    AND (
      channels.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.school_id = channels.school_id
      )
    )
  )
);

-- Allow users to send messages
CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Enable RLS on channels table
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Allow users to view channels in their school
CREATE POLICY "Users can view school channels" ON channels
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.school_id = channels.school_id
  )
);

-- Allow users to create channels
CREATE POLICY "Users can create channels" ON channels
FOR INSERT WITH CHECK (created_by = auth.uid());
