/*
  # Create documentation table

  1. New Tables
    - `documentation`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `documentation` table
    - Add policies for authenticated users to:
      - Read their own documentation
      - Create documentation for their projects
      - Update their own documentation
      - Delete their own documentation
*/

-- Create documentation table
CREATE TABLE IF NOT EXISTS documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own documentation"
  ON documentation
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create documentation"
  ON documentation
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documentation"
  ON documentation
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documentation"
  ON documentation
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());