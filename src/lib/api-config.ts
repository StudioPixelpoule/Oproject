import { z } from 'zod';

// Schema for validating environment variables
const envSchema = z.object({
  VITE_GITHUB_TOKEN: z.string().min(1, 'GitHub token is required'),
  VITE_OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anonymous key is required'),
});

// Type for validated environment variables
type EnvConfig = z.infer<typeof envSchema>;

// Function to validate environment variables
export function validateEnvConfig(): EnvConfig {
  try {
    return envSchema.parse({
      VITE_GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN,
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Variables d'environnement manquantes ou invalides : ${missingVars}. Veuillez vérifier votre fichier .env.`);
    }
    throw error;
  }
}

// Function to get GitHub token with validation
export function getGitHubToken(): string {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (!token) {
    throw new Error('Token GitHub non configuré. Veuillez ajouter VITE_GITHUB_TOKEN dans votre fichier .env.');
  }
  if (!isValidGitHubToken(token)) {
    throw new Error('Format de token GitHub invalide. Le token doit être un token d\'accès personnel valide.');
  }
  return token;
}

// Function to get OpenAI API key with validation
export function getOpenAIKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) {
    throw new Error('Clé API OpenAI non configurée. Veuillez ajouter VITE_OPENAI_API_KEY dans votre fichier .env.');
  }
  if (!isValidOpenAIKey(key)) {
    throw new Error('Format de clé API OpenAI invalide. La clé doit commencer par "sk-" suivi de caractères alphanumériques.');
  }
  return key;
}

// Function to validate GitHub token format
export function isValidGitHubToken(token: string | undefined): boolean {
  if (!token) return false;
  
  // GitHub tokens can be:
  // 1. Classic tokens (40 hex characters)
  // 2. Fine-grained tokens (starts with 'github_pat_')
  // 3. OAuth tokens (starts with 'gho_')
  // 4. Personal access tokens (starts with 'ghp_')
  return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}|gho_[a-zA-Z0-9]{36}|[a-f0-9]{40})$/i.test(token);
}

// Function to validate OpenAI API key format
export function isValidOpenAIKey(key: string | undefined): boolean {
  if (!key) return false;
  // OpenAI API keys start with 'sk-' and are followed by alphanumeric characters
  return /^sk-[a-zA-Z0-9]{48}$/.test(key);
}