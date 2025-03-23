export async function fetchGitHubContent(owner: string, repo: string, path: string = '') {
  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    // First, try to get the default branch
    let defaultBranch = 'main';
    try {
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        defaultBranch = repoData.default_branch;
      }
    } catch (error) {
      console.warn('Could not fetch default branch, falling back to main/master');
    }

    // Try all possible branches in order
    const branchesToTry = [defaultBranch, 'main', 'master', 'development', 'dev'];
    let response = null;
    let lastError = null;

    for (const branch of branchesToTry) {
      try {
        response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
          { headers }
        );
        if (response.ok) break;
        lastError = response;
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    if (!response?.ok) {
      if (lastError?.status === 404) {
        throw new Error(`Repository ou chemin introuvable (branches testées: ${branchesToTry.join(', ')}). Vérifiez l'URL GitHub du projet.`);
      }
      if (lastError?.status === 403) {
        const rateLimitResponse = await fetch('https://api.github.com/rate_limit', { headers });
        if (rateLimitResponse.ok) {
          const rateLimit = await rateLimitResponse.json();
          if (rateLimit.resources.core.remaining === 0) {
            throw new Error('Limite d\'API GitHub dépassée. Réessayez plus tard ou configurez un token GitHub valide.');
          }
        }
        throw new Error('Accès refusé à l\'API GitHub. Vérifiez votre token GitHub.');
      }
      throw new Error(`Erreur API GitHub: ${lastError?.statusText || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      // Filter relevant files for documentation
      return data.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isRelevantFile = ['md', 'ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'less'].includes(ext || '') && 
               !file.name.startsWith('.') &&
               !file.name.includes('.test.') &&
               !file.name.includes('.spec.') &&
               !file.name.includes('.min.') &&
               !file.name.includes('.d.ts') &&
               file.size < 500000; // 500KB max

        // Special handling for common configuration files
        const isConfigFile = [
          'package.json',
          'tsconfig.json',
          'vite.config.ts',
          'tailwind.config.js',
          'postcss.config.js',
          'eslint.config.js',
          '.eslintrc.js',
          '.eslintrc.json',
          '.prettierrc.js',
          '.prettierrc.json',
        ].includes(file.name);

        return isRelevantFile || isConfigFile;
      });
    } else {
      throw new Error('Format de réponse GitHub invalide');
    }
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
    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    // Try different URL formats and methods
    const urlsToTry = [
      url, // Original URL
      url.replace('api.github.com/repos', 'raw.githubusercontent.com').replace('/contents/', '/'), // Raw URL
      url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'), // Direct raw URL
      url.replace('/contents/', '/raw/'), // Alternative raw format
      url.replace('/contents/', '/'), // Simple path
      url.replace('/blob/', '/raw/'), // GitHub blob to raw
    ];

    let response = null;
    let lastError = null;

    // Try each URL format with multiple branches
    const branchesToTry = ['main', 'master', 'development', 'dev'];
    
    for (const tryUrl of urlsToTry) {
      for (const branch of branchesToTry) {
        try {
          const branchUrl = tryUrl.includes('?') 
            ? `${tryUrl}&ref=${branch}`
            : `${tryUrl}?ref=${branch}`;

          // First try HEAD to check if file exists and is accessible
          const headResponse = await fetch(branchUrl, { 
            method: 'HEAD',
            headers 
          });
          
          if (headResponse.ok) {
            // If HEAD succeeds, try GET
            response = await fetch(branchUrl, { headers });
            if (response.ok) break;
          }
          
          lastError = response || headResponse;
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      
      if (response?.ok) break;
    }

    if (!response?.ok) {
      if (lastError?.status === 404) {
        throw new Error('Fichier introuvable. Vérifiez que le fichier existe dans le repository.');
      }
      if (lastError?.status === 403) {
        const rateLimitResponse = await fetch('https://api.github.com/rate_limit', { headers });
        if (rateLimitResponse.ok) {
          const rateLimit = await rateLimitResponse.json();
          if (rateLimit.resources.core.remaining === 0) {
            throw new Error('Limite d\'API GitHub dépassée. Réessayez plus tard ou configurez un token GitHub valide.');
          }
        }
        throw new Error('Accès refusé à l\'API GitHub. Vérifiez votre token GitHub.');
      }
      throw new Error(`Erreur lors de la récupération du fichier: ${lastError?.statusText || 'Erreur inconnue'}`);
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