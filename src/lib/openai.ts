import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Create OpenAI client only if API key is available
export const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
}) : null;

export async function generateDocumentation(files: { name: string; content: string }[]) {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
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
    if (error instanceof Error) {
      throw new Error(`Erreur de génération de la documentation: ${error.message}`);
    }
    throw new Error('Erreur lors de la génération de la documentation');
  }
}