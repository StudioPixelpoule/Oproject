# O.O Project Management

Application de gestion de projets avec authentification, gestion des tâches, documentation, versions et environnements.

## Technologies

- React
- TypeScript
- Tailwind CSS
- Supabase
- Vite

## Installation

```bash
# Cloner le repository
git clone <votre-url-github>

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Démarrer le serveur de développement
npm run dev
```

## Déploiement

Le projet est configuré pour être déployé sur Netlify. Pour déployer manuellement :

1. Créez un nouveau site sur Netlify
2. Connectez votre repository GitHub
3. Configurez les variables d'environnement dans Netlify :
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_OPENAI_API_KEY (optionnel)
   - VITE_GITHUB_TOKEN (optionnel)

Les redirections sont déjà configurées dans le fichier `netlify.toml`.

## Structure du projet

```
src/
  ├── components/     # Composants React réutilisables
  ├── contexts/       # Contextes React (auth, etc.)
  ├── lib/           # Utilitaires et configurations
  ├── pages/         # Pages de l'application
  └── types/         # Types TypeScript
```

## Fonctionnalités

- Authentification utilisateur
- Gestion des projets
- Suivi des tâches
- Documentation avec Markdown
- Gestion des versions
- Configuration des environnements
- Gestion des dépendances