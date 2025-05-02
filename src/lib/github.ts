import { parseGitHubUrl } from './api-config';

export class GitHubAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

async function handleGitHubResponse(response: Response) {
  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubAPIError('Repository introuvable. Vérifiez que l\'URL est correcte et que vous avez les permissions nécessaires.');
    } else if (response.status === 403) {
      throw new GitHubAPIError('Limite de requêtes GitHub dépassée ou authentification requise. Vérifiez vos permissions.');
    } else {
      throw new GitHubAPIError(`Erreur GitHub: ${response.statusText}`);
    }
  }
  return response.json();
}

export async function validateGitHubUrl(url: string): Promise<boolean> {
  try {
    const repoInfo = parseGitHubUrl(url);
    if (!repoInfo) {
      console.error('Format d\'URL GitHub invalide');
      return false;
    }

    const { owner, repo } = repoInfo;
    
    // Nettoyer le nom du repo (enlever .git s'il est présent)
    const cleanRepo = repo.replace(/\.git$/, '');
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.status === 404) {
      console.error(`Repository ${owner}/${cleanRepo} non trouvé`);
      return false;
    }
    
    if (response.status === 403) {
      console.error('Limite de requêtes GitHub dépassée ou authentification requise');
      return false;
    }
    
    if (!response.ok) {
      console.error(`Erreur GitHub: ${response.status} ${response.statusText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la validation de l\'URL GitHub:', error);
    return false;
  }
}

export async function fetchGitHubContent(owner: string, repo: string, path: string = '') {
  try {
    // Nettoyer le nom du repo
    const cleanRepo = repo.replace(/\.git$/, '');
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/${path}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    return handleGitHubResponse(response);
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError('Erreur lors de la récupération du contenu GitHub');
  }
}

export async function fetchFileContent(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new GitHubAPIError('Erreur lors de la récupération du fichier');
    }
    return response.text();
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new GitHubAPIError('Erreur lors de la lecture du fichier');
  }
}