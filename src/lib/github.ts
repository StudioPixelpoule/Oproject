import { getGitHubToken, isValidGitHubToken } from './api-config';

interface GitHubError {
  message: string;
  documentation_url?: string;
}

class GitHubAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

async function handleGitHubResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json() as GitHubError;
    
    switch (response.status) {
      case 401:
        throw new GitHubAPIError('Token GitHub invalide ou expiré. Veuillez vérifier votre configuration.', 401);
      case 403:
        if (response.headers.get('X-RateLimit-Remaining') === '0') {
          throw new GitHubAPIError('Limite d\'API GitHub dépassée. Réessayez plus tard.', 403);
        }
        throw new GitHubAPIError('Accès refusé à l\'API GitHub. Vérifiez les permissions de votre token.', 403);
      case 404:
        throw new GitHubAPIError('Repository ou ressource introuvable. Vérifiez l\'URL GitHub.', 404);
      default:
        throw new GitHubAPIError(error.message || 'Erreur API GitHub inconnue', response.status);
    }
  }
  return response;
}

export async function fetchGitHubContent(owner: string, repo: string, path: string = '') {
  try {
    const token = getGitHubToken();
    if (!isValidGitHubToken(token)) {
      throw new Error('Format de token GitHub invalide. Veuillez vérifier votre configuration.');
    }

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${token}`,
    };

    // First, try to get the default branch
    let defaultBranch = 'main';
    try {
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      ).then(handleGitHubResponse);
      
      const repoData = await repoResponse.json();
      defaultBranch = repoData.default_branch;
    } catch (error) {
      console.warn('Could not fetch default branch:', error);
      throw error;
    }

    // Get repository contents
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${defaultBranch}`,
      { headers }
    ).then(handleGitHubResponse);

    const data = await response.json();
    if (Array.isArray(data)) {
      // Filter relevant files
      return data.filter(file => {
        const name = file.name.toLowerCase();
        return (
          name === 'package.json' ||
          name === '.env' ||
          name === '.env.example' ||
          name === '.env.local' ||
          name === '.env.development' ||
          name === '.env.production' ||
          name === '.env.staging'
        );
      });
    }

    throw new Error('Format de réponse GitHub invalide');
  } catch (error) {
    console.error('Error fetching GitHub content:', error);
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new Error('Erreur lors de la récupération du contenu GitHub');
  }
}

export async function fetchFileContent(url: string) {
  try {
    const token = getGitHubToken();
    if (!isValidGitHubToken(token)) {
      throw new Error('Format de token GitHub invalide. Veuillez vérifier votre configuration.');
    }

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3.raw',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, { headers }).then(handleGitHubResponse);
    const content = await response.text();
    
    if (!content.trim()) {
      throw new Error('Le fichier est vide');
    }

    return content;
  } catch (error) {
    console.error('Error fetching file content:', error);
    if (error instanceof GitHubAPIError) {
      throw error;
    }
    throw new Error('Erreur lors de la récupération du fichier');
  }
}