import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('VITE_OPENAI_API_KEY environment variable is missing');
}

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

export async function generateDocumentation(files: { name: string; content: string }[]) {
  try {
    // First, prepare a structured summary of the files
    const filesSummary = files.map(f => ({
      name: f.name,
      // Truncate content if too long to stay within token limits
      content: f.content.length > 10000 ? f.content.slice(0, 10000) + '...' : f.content
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a technical documentation expert. Generate comprehensive documentation in markdown format following these guidelines:

1. Start with a high-level project overview
2. Document the architecture and key components
3. Explain important implementation details
4. Include code examples for key features
5. Use clear headings and sections
6. Focus on maintainability and clarity`
        },
        {
          role: "user",
          content: `Please analyze these project files and generate documentation:\n\n${filesSummary.map(f => 
            `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``
          ).join('\n\n')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const documentation = response.choices[0].message.content || '';
    
    // Add metadata and formatting
    return `# Documentation Technique
> Générée automatiquement le ${new Date().toLocaleDateString('fr-FR')}

${documentation}

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