/*
  # Add admin role management

  1. Changes
    - Add is_admin column to users table
    - Add RLS policies for admin access

  2. Security
    - Enable RLS on users table
    - Add policies for admin and regular user access
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
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
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM users WHERE is_admin = true
    )
  );