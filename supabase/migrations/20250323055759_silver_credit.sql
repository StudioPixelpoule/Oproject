/*
  # Add local path to projects table

  1. Changes
    - Add `local_path` column to `projects` table to store the local directory path
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'local_path'
  ) THEN
    ALTER TABLE projects ADD COLUMN local_path text;
  END IF;
END $$;