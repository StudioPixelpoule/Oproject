/*
  # Add database fields to projects table

  1. Changes
    - Add database_provider column to projects table
    - Add database_name column to projects table

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS database_provider text,
ADD COLUMN IF NOT EXISTS database_name text;