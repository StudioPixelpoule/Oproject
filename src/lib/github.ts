import OpenAI from 'openai';

export async function fetchGitHubContent(owner: string, repo: string, path: string = '') {
  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('Token GitHub non configuré. Ajoutez VITE_GITHUB_TOKEN à vos variables d\'environnement.');
    }

    headers.Authorization = `Bearer ${githubToken}`;

    // First, try to get the default branch
    let defaultBranch = 'main';
    try {
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      
      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          throw new Error('Repository introuvable. Vérifiez l\'URL GitHub.');
        }
        if (repoResponse.status === 401) {
          throw new Error('Token GitHub invalide. Vérifiez votre configuration.');
        }
        throw new Error(`Erreur GitHub: ${repoResponse.statusText}`);
      }

      const repoData = await repoResponse.json();
      defaultBranch = repoData.default_branch;
    } catch (error) {
      console.error('Could not fetch default branch:', error);
      throw error;
    }

    // Get repository contents
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${defaultBranch}`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Fichiers de configuration introuvables. Vérifiez le repository.');
      }
      if (response.status === 401) {
        throw new Error('Token GitHub invalide. Vérifiez votre configuration.');
      }
      if (response.status === 403) {
        const rateLimitResponse = await fetch('https://api.github.com/rate_limit', { headers });
        if (rateLimitResponse.ok) {
          const rateLimit = await rateLimitResponse.json();
          if (rateLimit.resources.core.remaining === 0) {
            throw new Error('Limite d\'API GitHub dépassée. Réessayez plus tard.');
          }
        }
        throw new Error('Accès refusé à l\'API GitHub. Vérifiez votre token GitHub.');
      }
      throw new Error(`Erreur API GitHub: ${response.statusText}`);
    }

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
    throw error;
  }
}

export async function fetchFileContent(url: string) {
  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3.raw',
    };

    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('Token GitHub non configuré. Ajoutez VITE_GITHUB_TOKEN à vos variables d\'environnement.');
    }

    headers.Authorization = `Bearer ${githubToken}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Fichier introuvable. Vérifiez le repository.');
      }
      if (response.status === 401) {
        throw new Error('Token GitHub invalide. Vérifiez votre configuration.');
      }
      if (response.status === 403) {
        throw new Error('Accès refusé à l\'API GitHub. Vérifiez votre token GitHub.');
      }
      throw new Error(`Erreur lors de la récupération du fichier: ${response.statusText}`);
    }

    const content = await response.text();
    if (!content.trim()) {
      throw new Error('Le fichier est vide');
    }

    return content;
  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
}