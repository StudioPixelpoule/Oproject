/*
  # Add admin role to users

  1. Changes
    - Add `is_admin` boolean column to users table
    - Set default value to false
    - Update specific user to be admin

  2. Security
    - Enable RLS on users table
    - Add policy for users to read their own data
    - Add policy for admins to read all data
*/

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Update your user to be admin (replace with your user's email)
UPDATE users 
SET is_admin = true 
WHERE email = 'your.email@example.com';

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can read own data" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Allow admins to read all data
CREATE POLICY "Admins can read all data" 
  ON users 
  FOR ALL 
  TO authenticated 
  USING (is_admin = true);