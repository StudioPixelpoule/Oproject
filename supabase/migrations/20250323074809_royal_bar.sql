/*
  # Create environments table

  1. New Tables
    - `environments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `name` (text) - e.g., 'development', 'staging', 'production'
      - `variables` (jsonb) - Store environment variables as key-value pairs
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `environments` table
    - Add policies for authenticated users to:
      - Read their own environments
      - Create environments for their projects
      - Update their own environments
      - Delete their own environments
*/

-- Create environments table
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

-- Create policies
CREATE POLICY "Users can read own environments"
  ON environments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create environments"
  ON environments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own environments"
  ON environments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own environments"
  ON environments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());