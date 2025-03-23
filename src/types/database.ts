export type ProjectType = 'webapp' | 'mobile' | 'autre';
export type ProjectStatus = 'à faire' | 'en cours' | 'terminé' | 'en pause';
export type TaskStatus = 'à faire' | 'en cours' | 'fait';
export type DatabaseProvider = 'supabase' | 'firebase' | 'mongodb' | 'mysql' | 'postgresql';

export interface AIProvider {
  name: string;
  models: string[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  {
    name: 'Mistral AI',
    models: ['mistral-large', 'mistral-medium', 'mistral-small'],
  },
  {
    name: 'Gemini',
    models: ['gemini-pro', 'gemini-pro-vision'],
  },
];

export interface Project {
  id: string;
  title: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  start_date?: string;
  deadline?: string;
  stack?: string;
  github_url?: string;
  deploy_url?: string;
  database_provider?: DatabaseProvider;
  database_name?: string;
  supabase_url?: string;
  local_path?: string;
  ai_provider?: string;
  ai_model?: string;
  ai_api_key?: string;
  created_at: string;
  user_id: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  notes?: string;
  created_at: string;
  user_id: string;
}

export interface Note {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  user_id: string;
}