-- Add teacher_password column to teacher_applications table
-- This allows us to store the password temporarily until admin approval

-- Add the column
ALTER TABLE teacher_applications 
ADD COLUMN IF NOT EXISTS teacher_password TEXT;

-- Add a comment to explain the purpose
COMMENT ON COLUMN teacher_applications.teacher_password IS 'Temporary password storage until teacher account is created upon admin approval';

-- Verify the change
SELECT 'teacher_password column added successfully!' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teacher_applications' 
AND column_name = 'teacher_password';
