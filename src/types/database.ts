import { z } from 'zod';

export type ProjectType = 'webapp' | 'mobile' | 'autre';
export type ProjectStatus = 'à faire' | 'en cours' | 'terminé' | 'en pause';
export type TaskStatus = 'à faire' | 'en cours' | 'fait';
export type DatabaseProvider = 'supabase' | 'firebase' | 'mongodb' | 'mysql' | 'postgresql';
export type HostingProvider = 'netlify' | 'vercel' | 'heroku' | 'aws' | 'gcp' | 'azure';

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

export const HOSTING_PROVIDERS: HostingProvider[] = [
  'netlify',
  'vercel',
  'heroku',
  'aws',
  'gcp',
  'azure',
];

export const projectSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  type: z.enum(['webapp', 'mobile', 'autre'] as const),
  status: z.enum(['à faire', 'en cours', 'terminé', 'en pause'] as const),
  start_date: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  stack: z.string().optional(),
  github_url: z.string().url('URL GitHub invalide').optional().nullable(),
  deploy_url: z.string().url('URL de déploiement invalide').optional().nullable(),
  hosting_provider: z.enum(['netlify', 'vercel', 'heroku', 'aws', 'gcp', 'azure'] as const).optional().nullable(),
  hosting_url: z.string().url('URL de gestion invalide').optional().nullable(),
  database_provider: z.enum(['supabase', 'firebase', 'mongodb', 'mysql', 'postgresql'] as const).optional().nullable(),
  database_name: z.string().optional().nullable(),
  supabase_url: z.string().url('URL Supabase invalide').optional().nullable(),
  local_path: z.string().optional().nullable(),
  ai_provider: z.string().optional().nullable(),
  ai_model: z.string().optional().nullable(),
  ai_api_key: z.string().optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

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
  hosting_provider?: HostingProvider;
  hosting_url?: string;
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