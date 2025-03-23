/*
  # Add AI API fields to projects table

  1. Changes
    - Add new columns to projects table:
      - ai_provider (text): The AI provider (e.g., OpenAI, Anthropic)
      - ai_model (text): The specific model being used
      - ai_api_key (text): Encrypted API key for the AI service
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'ai_provider'
  ) THEN
    ALTER TABLE projects ADD COLUMN ai_provider text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'ai_model'
  ) THEN
    ALTER TABLE projects ADD COLUMN ai_model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'ai_api_key'
  ) THEN
    ALTER TABLE projects ADD COLUMN ai_api_key text;
  END IF;
END $$;