/*
  # Fix environments table policies

  This migration ensures the environments table exists and has the correct policies,
  checking for their existence before creating them.

  1. Changes
    - Add existence checks for policies before creation
    - Keep table creation and RLS enabling as-is
*/

-- Create environments table if it doesn't exist
CREATE TABLE IF NOT EXISTS environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;

-- Create policies with existence checks
DO $$ 
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'environments' 
    AND policyname = 'Users can read own environments'
  ) THEN
    CREATE POLICY "Users can read own environments"
      ON environments
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'environments' 
    AND policyname = 'Users can create environments'
  ) THEN
    CREATE POLICY "Users can create environments"
      ON environments
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'environments' 
    AND policyname = 'Users can update own environments'
  ) THEN
    CREATE POLICY "Users can update own environments"
      ON environments
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'environments' 
    AND policyname = 'Users can delete own environments'
  ) THEN
    CREATE POLICY "Users can delete own environments"
      ON environments
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;