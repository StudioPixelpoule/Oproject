import OpenAI from 'openai';
import { getOpenAIKey } from './api-config';

class OpenAIClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIClientError';
  }
}

function createOpenAIClient() {
  try {
    const apiKey = getOpenAIKey();
    
    if (!apiKey) {
      throw new OpenAIClientError('Clé API OpenAI non configurée. Veuillez ajouter VITE_OPENAI_API_KEY dans votre fichier .env.');
    }

    // Validate OpenAI API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
      throw new OpenAIClientError('Format de clé API OpenAI invalide. La clé doit commencer par "sk-" et contenir au moins 40 caractères.');
    }

    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new OpenAIClientError(error.message);
    }
    throw new OpenAIClientError('Erreur lors de la création du client OpenAI');
  }
}

// Create OpenAI client
let openai: OpenAI | null = null;
try {
  openai = createOpenAIClient();
} catch (error) {
  console.error('Error creating OpenAI client:', error);
  // Don't throw here, let the functions handle the null client
}

export async function generateDocumentation(files: { name: string; content: string }[]) {
  try {
    if (!openai) {
      return `# Documentation technique

> **Note**: La génération automatique de documentation n'est pas disponible car la clé API OpenAI n'est pas configurée.
> Pour activer cette fonctionnalité, ajoutez VITE_OPENAI_API_KEY dans votre fichier .env.

## Structure du projet

${files.map(f => `### ${f.name}`).join('\n\n')}

## Guide d'installation

1. Clonez le repository
2. Installez les dépendances avec \`npm install\`
3. Configurez les variables d'environnement
4. Lancez le projet avec \`npm run dev\`

## Technologies utilisées

Les technologies suivantes ont été identifiées dans le projet :

${files.map(f => {
  if (f.name === 'package.json') {
    try {
      const pkg = JSON.parse(f.content);
      return `### Dépendances
${Object.keys(pkg.dependencies || {}).map(dep => `- ${dep}`).join('\n')}

### Dépendances de développement
${Object.keys(pkg.devDependencies || {}).map(dep => `- ${dep}`).join('\n')}`;
    } catch (e) {
      return '';
    }
  }
  return '';
}).filter(Boolean).join('\n\n')}

## Contribution

1. Créez une branche pour votre fonctionnalité
2. Committez vos changements
3. Ouvrez une Pull Request

## Licence

À définir

---
> Cette documentation a été générée automatiquement sans l'aide de l'IA.
> Pour une documentation plus détaillée, configurez la clé API OpenAI.`;
    }

    // First, prepare a structured summary of the files
    const filesSummary = files.map(f => ({
      name: f.name,
      // Truncate content if too long to stay within token limits
      content: f.content.length > 10000 ? f.content.slice(0, 10000) + '...' : f.content
    }));

    // Generate technical documentation
    const technicalResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Vous êtes un expert en documentation technique. Générez une documentation complète en français au format markdown en suivant ces directives :

1. Commencez par une vue d'ensemble du projet
2. Documentez l'architecture et les composants clés
3. Expliquez les détails d'implémentation importants
4. Incluez des exemples de code pour les fonctionnalités principales
5. Utilisez des titres et sections clairs
6. Mettez l'accent sur la maintenabilité et la clarté
7. Utilisez un langage technique précis mais accessible`
        },
        {
          role: "user",
          content: `Analysez ces fichiers de projet et générez une documentation technique en français :\n\n${filesSummary.map(f => 
            `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``
          ).join('\n\n')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Generate user manual
    const userManualResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Vous êtes un expert en documentation utilisateur. Créez un manuel d'utilisation complet en français au format markdown en suivant ces directives :

1. Introduction claire du produit et de son objectif
2. Guide de démarrage rapide
3. Description détaillée de toutes les fonctionnalités
4. Instructions étape par étape pour chaque action possible
5. Captures d'écran et exemples concrets (à décrire textuellement)
6. FAQ et résolution des problèmes courants
7. Utilisez un langage simple et accessible
8. Évitez le jargon technique sauf si nécessaire`
        },
        {
          role: "user",
          content: `Analysez ces fichiers de projet et créez un manuel d'utilisation complet en français :\n\n${filesSummary.map(f => 
            `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``
          ).join('\n\n')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const technicalDoc = technicalResponse.choices[0].message.content || '';
    const userManual = userManualResponse.choices[0].message.content || '';
    
    // Combine both documents
    return `# Documentation Technique
> Générée automatiquement le ${new Date().toLocaleDateString('fr-FR')}

${technicalDoc}

# Manuel d'Utilisation
> Généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}

${userManual}

## Fichiers Analysés
${files.map(f => `- \`${f.name}\``).join('\n')}
`;
  } catch (error) {
    console.error('Error generating documentation:', error);
    if (error instanceof OpenAIClientError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Erreur de génération de la documentation: ${error.message}`);
    }
    throw new Error('Erreur lors de la génération de la documentation');
  }
}