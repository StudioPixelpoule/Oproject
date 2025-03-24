import { z } from 'zod';

// Schema for validating environment variables
const envSchema = z.object({
  VITE_GITHUB_TOKEN: z.string().optional(),
  VITE_OPENAI_API_KEY: z.string().optional(),
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

// Function to get GitHub token
export function getGitHubToken(): string | null {
  return import.meta.env.VITE_GITHUB_TOKEN || null;
}

// Function to get OpenAI API key
export function getOpenAIKey(): string | null {
  return import.meta.env.VITE_OPENAI_API_KEY || null;
}

// Function to parse GitHub URL
export function parseGitHubUrl(url: string | null | undefined): { owner: string; repo: string } | null {
  if (!url) return null;

  try {
    // Clean up the URL first
    let cleanUrl = url.trim().replace(/\/$/, '');
    
    // Correction pour divers formats erronés
    cleanUrl = cleanUrl.replace(/\.(gi|gitt?)$/, '.git');
    
    // Common patterns for GitHub URLs
    const patterns = [
      // HTTPS URLs
      /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
      // Git URLs
      /^git@github\.com:([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
      // Raw URLs
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
      // Pattern plus permissif pour capturer les erreurs courantes
      /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.[a-z]{1,4})?$/,
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        const [, owner, repo] = match;
        
        // Validation owner et repo
        if (!owner || !repo) {
          console.error('Invalid GitHub URL: missing owner or repo');
          return null;
        }

        // Basic validation
        if (owner.length < 1 || repo.length < 1) {
          console.error('Invalid GitHub URL: owner or repo too short');
          return null;
        }

        // Nettoyage supplémentaire du nom du repo
        const cleanRepo = repo.replace(/\.[a-z]{1,4}$/, '');
        
        return {
          owner: owner,
          repo: cleanRepo
        };
      }
    }

    console.error('URL does not match any known GitHub URL pattern:', url);
    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
}

// Function to test GitHub URL
export function testGitHubUrl(url: string): { isValid: boolean; message: string } {
  try {
    const result = parseGitHubUrl(url);
    
    if (!result) {
      return {
        isValid: false,
        message: 'URL GitHub invalide. Format attendu: https://github.com/owner/repo'
      };
    }

    return {
      isValid: true,
      message: `URL valide. Propriétaire: ${result.owner}, Repository: ${result.repo}`
    };
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la validation de l\'URL GitHub'
    };
  }
}