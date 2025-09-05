-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile during setup
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all profiles in their school
CREATE POLICY "Admins can view school profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id = profiles.school_id
  )
);

-- Allow admins to insert profiles for their school
CREATE POLICY "Admins can insert school profiles" ON profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id = profiles.school_id
  )
);

-- Allow admins to update profiles in their school
CREATE POLICY "Admins can update school profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'admin'
    AND admin_profile.school_id = profiles.school_id
  )
);

-- Enable RLS on schools table
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read schools (for setup)
CREATE POLICY "Authenticated users can view schools" ON schools
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage schools
CREATE POLICY "Admins can manage schools" ON schools
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
