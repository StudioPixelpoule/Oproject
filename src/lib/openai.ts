import { getOpenAIKey } from './api-config';
import OpenAI from 'openai';

class OpenAIClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIClientError';
  }
}

let openaiClientInstance: OpenAI | null = null;
let isOpenAIAvailable = false;

export function createOpenAIClient(): OpenAI | null {
  try {
    const apiKey = getOpenAIKey();
    
    if (!apiKey) {
      console.warn('OpenAI API key not configured. Some features will be disabled.');
      isOpenAIAvailable = false;
      return null;
    }
    
    if (!openaiClientInstance) {
      openaiClientInstance = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: Only for development
      });
    }
    
    isOpenAIAvailable = true;
    return openaiClientInstance;
  } catch (error) {
    console.error('Error creating OpenAI client:', error);
    isOpenAIAvailable = false;
    return null;
  }
}

export function getOpenAIClient(): OpenAI | null {
  if (!openaiClientInstance) {
    return createOpenAIClient();
  }
  return openaiClientInstance;
}

export function isOpenAIClientAvailable(): boolean {
  if (!isOpenAIAvailable && !openaiClientInstance) {
    // Try to create the client if it hasn't been attempted yet
    createOpenAIClient();
  }
  return isOpenAIAvailable;
}

// La fonction generateDocumentation manquante
export async function generateDocumentation(projectData: any, fileContent?: string): Promise<string> {
  const client = getOpenAIClient();
  
  if (!client) {
    return `# Documentation du projet ${projectData.name || 'Sans nom'}

> **Note**: La génération automatique de documentation n'est pas disponible car la clé API OpenAI n'est pas configurée.
> Pour activer cette fonctionnalité, ajoutez VITE_OPENAI_API_KEY dans votre fichier .env.

## À propos du projet
${projectData.description || 'Aucune description disponible.'}

## Structure suggérée de documentation

1. **Introduction**
   - Présentation du projet
   - Objectifs et problématiques résolues

2. **Installation**
   - Prérequis
   - Étapes d'installation
   - Configuration

3. **Utilisation**
   - Fonctionnalités principales
   - Exemples d'utilisation

4. **Architecture technique**
   - Stack technologique
   - Structure du code
   - Composants principaux

5. **Contribution**
   - Comment contribuer
   - Standards de code
   - Processus de revue

6. **Licence et attribution**
   - Informations sur la licence
   - Crédits et contributeurs
`;
  }
  
  try {
    // Préparation des données pour l'IA
    const docContext = {
      name: projectData.name || 'Projet sans nom',
      description: projectData.description || '',
      githubUrl: projectData.githubUrl || '',
      stack: projectData.stack || [],
      fileExcerpt: fileContent ? (fileContent.length > 3000 ? fileContent.substring(0, 3000) + '...' : fileContent) : undefined
    };
    
    const prompt = `
      Génère une documentation complète et structurée pour ce projet :
      ${JSON.stringify(docContext, null, 2)}
      
      La documentation doit inclure :
      1. Une introduction expliquant l'objectif du projet
      2. Une section d'installation et de configuration
      3. Un guide d'utilisation des fonctionnalités principales
      4. Une explication de l'architecture technique
      5. Des sections pour la contribution et la licence si pertinent
      
      Format la documentation en Markdown soigné et structuré.
      Adapte le contenu aux technologies identifiées dans le stack.
      Si des informations sont manquantes, propose des sections standard que l'utilisateur pourra compléter.
    `;
    
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Tu es un expert en documentation technique qui génère des documentations claires, structurées et utiles pour les projets de développement logiciel." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const generatedDoc = response.choices[0]?.message?.content || '';
    
    if (!generatedDoc) {
      throw new Error("L'IA n'a pas généré de contenu");
    }
    
    return generatedDoc;
  } catch (error) {
    console.error('Error generating documentation:', error);
    
    // Retourner une documentation de base en cas d'erreur
    return `# Documentation du projet ${projectData.name || 'Sans nom'}

> **Note**: Une erreur s'est produite lors de la génération automatique de la documentation.
> Message d'erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}

## À propos du projet
${projectData.description || 'Aucune description disponible.'}

## Technologies
${projectData.stack?.join(', ') || 'Non spécifiées'}

## Comment compléter cette documentation

Cette documentation est générée automatiquement et pourrait nécessiter des compléments manuels. Voici les sections recommandées à ajouter:

1. Installation et configuration
2. Utilisation et exemples
3. Architecture du code
4. Contribution
5. Licence
`;
  }
}

// Assistant function that can work without OpenAI API as fallback
export async function analyzeProjectWithAI(projectData: any): Promise<any> {
  const client = getOpenAIClient();
  
  if (!client) {
    return {
      success: false,
      message: "L'analyse avec IA n'est pas disponible. Clé API OpenAI non configurée.",
      suggestions: []
    };
  }
  
  try {
    // Simplified project data to reduce token usage
    const simplifiedData = {
      name: projectData.name,
      description: projectData.description || '',
      githubUrl: projectData.githubUrl || '',
      stack: projectData.stack || [],
      // Add other relevant fields as needed
    };
    
    const prompt = `
      Analyze this project:
      ${JSON.stringify(simplifiedData, null, 2)}
      
      Provide:
      1. Three suggestions to improve the project
      2. Any potential issues to be aware of
      3. A brief overview of the technology stack
    `;
    
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes software projects and provides constructive feedback." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    return {
      success: true,
      message: "Analyse complétée avec succès",
      analysis: content,
      // You can add more structured parsing of the response here
      suggestions: extractSuggestions(content)
    };
  } catch (error) {
    console.error('Error analyzing project with AI:', error);
    return {
      success: false,
      message: `Erreur lors de l'analyse avec l'IA: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      suggestions: []
    };
  }
}

// Helper function to extract suggestions from AI response
function extractSuggestions(content: string): string[] {
  try {
    // Simple regex to extract numbered items
    const suggestions = content.match(/\d+\.\s+([^\n]+)/g) || [];
    return suggestions.map(s => s.replace(/^\d+\.\s+/, '').trim());
  } catch (e) {
    console.error('Error extracting suggestions:', e);
    return [];
  }
}