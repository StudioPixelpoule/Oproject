/*
  # Add versions table and storage

  1. New Tables
    - `versions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `version` (text) - Numéro de version
      - `description` (text) - Description des changements
      - `file_path` (text) - Chemin du fichier dans le storage
      - `file_size` (bigint) - Taille du fichier en bytes
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)

  2. Storage
    - Create new bucket for project versions
    
  3. Security
    - Enable RLS on versions table
    - Add policies for authenticated users
    - Add storage policies
*/

-- Create versions table
CREATE TABLE IF NOT EXISTS versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  version text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own versions"
  ON versions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own versions"
  ON versions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own versions"
  ON versions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own versions"
  ON versions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name)
VALUES ('project_versions', 'project_versions')
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload project versions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project_versions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own project versions"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project_versions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own project versions"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project_versions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );