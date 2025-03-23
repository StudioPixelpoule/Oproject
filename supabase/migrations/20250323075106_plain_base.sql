/*
  # Create dependencies table

  This migration adds support for tracking project dependencies.

  1. New Tables
    - `dependencies`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text, package name)
      - `version` (text, package version)
      - `type` (text, production or development)
      - `description` (text, optional)
      - `homepage` (text, optional)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create dependencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  version text NOT NULL,
  type text NOT NULL CHECK (type IN ('production', 'development')),
  description text,
  homepage text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Create policies with existence checks
DO $$ 
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' 
    AND policyname = 'Users can read own dependencies'
  ) THEN
    CREATE POLICY "Users can read own dependencies"
      ON dependencies
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' 
    AND policyname = 'Users can create dependencies'
  ) THEN
    CREATE POLICY "Users can create dependencies"
      ON dependencies
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' 
    AND policyname = 'Users can update own dependencies'
  ) THEN
    CREATE POLICY "Users can update own dependencies"
      ON dependencies
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' 
    AND policyname = 'Users can delete own dependencies'
  ) THEN
    CREATE POLICY "Users can delete own dependencies"
      ON dependencies
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;