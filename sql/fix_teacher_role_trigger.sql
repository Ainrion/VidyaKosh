-- Fix the handle_new_user trigger to respect role from user metadata
-- This prevents the trigger from overriding teacher roles

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to respect role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get role from user metadata, default to 'student' if not specified
  -- This allows teacher invitations to work properly
  INSERT INTO public.profiles (id, email, full_name, role, school_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'), 
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also add a policy to allow service role to insert profiles (for teacher join API)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;

-- Create policies to allow service role to insert and update profiles (for teacher join API)
CREATE POLICY "Service role can insert profiles" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update profiles" ON profiles
FOR UPDATE USING (auth.role() = 'service_role');
