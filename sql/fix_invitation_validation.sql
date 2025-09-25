-- Fix invitation validation by allowing public access to validate invitations
-- Run this in your Supabase SQL Editor

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view invitations for their school" ON school_invitations;
DROP POLICY IF EXISTS "Admins can create invitations for their school" ON school_invitations;
DROP POLICY IF EXISTS "Admins can update invitations for their school" ON school_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations for their school" ON school_invitations;

-- Create new policies that allow public validation of invitations

-- Allow anyone to view pending invitations (for validation)
CREATE POLICY "Public can view pending invitations for validation" ON school_invitations
  FOR SELECT USING (status = 'pending');

-- Allow admins to view invitations for their school
CREATE POLICY "Admins can view school invitations" ON school_invitations
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to create invitations for their school
CREATE POLICY "Admins can create invitations for their school" ON school_invitations
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) AND invited_by = auth.uid()
  );

-- Allow admins to update invitations for their school
CREATE POLICY "Admins can update invitations for their school" ON school_invitations
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete invitations for their school
CREATE POLICY "Admins can delete invitations for their school" ON school_invitations
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow service role to manage all invitations (for API operations)
CREATE POLICY "Service role can manage all invitations" ON school_invitations
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Verify the policies were created
SELECT 'Invitation validation policies created successfully!' as status;
SELECT 'Public can now validate pending invitations' as message;
SELECT 'Admins retain full control over their school invitations' as admin_control;
