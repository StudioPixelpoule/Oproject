/*
  # Add Supabase URL to projects table

  1. Changes
    - Add `supabase_url` column to projects table
*/

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS supabase_url text;