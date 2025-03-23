/*
  # Initial Schema for O.O Project Management

  1. New Tables
    - `projects`
      - Main project information table
      - Includes all project metadata and status
    - `tasks`
      - Project tasks with status tracking
    - `notes`
      - Technical notes linked to projects
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin access
*/

-- Create custom types
CREATE TYPE project_type AS ENUM ('webapp', 'mobile', 'autre');
CREATE TYPE project_status AS ENUM ('à faire', 'en cours', 'terminé', 'en pause');
CREATE TYPE task_status AS ENUM ('à faire', 'en cours', 'fait');

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type project_type NOT NULL,
  status project_status NOT NULL DEFAULT 'à faire',
  start_date date,
  deadline date,
  stack text,
  github_url text,
  deploy_url text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  status task_status NOT NULL DEFAULT 'à faire',
  notes text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Enable all access for authenticated users only" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Policies for tasks
CREATE POLICY "Enable all access for authenticated users only" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Policies for notes
CREATE POLICY "Enable all access for authenticated users only" ON notes
  FOR ALL USING (auth.uid() = user_id);