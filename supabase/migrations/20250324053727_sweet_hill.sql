/*
  # Add hosting fields to projects table

  1. Changes
    - Add `hosting_provider` column to projects table
    - Add `hosting_url` column to projects table

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'hosting_provider'
  ) THEN
    ALTER TABLE projects ADD COLUMN hosting_provider text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'hosting_url'
  ) THEN
    ALTER TABLE projects ADD COLUMN hosting_url text;
  END IF;
END $$;