import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { fetchGitHubContent, fetchFileContent } from '../lib/github';
import { parseGitHubUrl } from '../lib/api-config';
import type { Project } from '../types/database';
import { projectSchema, AI_PROVIDERS, HOSTING_PROVIDERS } from '../types/database';
import type { ProjectFormData } from '../types/database';
import toast from 'react-hot-toast';

interface ProjectConfigDialogProps {
  project: Project;
  onClose: () => void;
  onSave: (data: ProjectFormData) => Promise<void>;
}

export default function ProjectConfigDialog({ project, onClose, onSave }: ProjectConfigDialogProps) {
  const [loadingStack, setLoadingStack] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, control, setValue, watch } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project.title,
      description: project.description,
      type: project.type,
      status: project.status,
      start_date: project.start_date,
      deadline: project.deadline,
      stack: project.stack,
      github_url: project.github_url,
      deploy_url: project.deploy_url,
      hosting_provider: project.hosting_provider,
      hosting_url: project.hosting_url,
      database_provider: project.database_provider,
      database_name: project.database_name,
      supabase_url: project.supabase_url,
      local_path: project.local_path,
      ai_provider: project.ai_provider,
      ai_model: project.ai_model,
      ai_api_key: project.ai_api_key,
    },
  });

  const githubUrl = useWatch({ control, name: 'github_url' });
  const selectedProvider = useWatch({ control, name: 'ai_provider' });

  useEffect(() => {
    if (githubUrl) {
      detectStackFromGitHub();
    }
  }, [githubUrl]);

  const detectStackFromGitHub = async () => {
    try {
      setLoadingStack(true);
      setGithubError(null);

      if (!githubUrl) {
        setGithubError('URL GitHub requise');
        setLoadingStack(false);
        return;
      }

      const repoInfo = parseGitHubUrl(githubUrl);
      if (!repoInfo) {
        setGithubError('URL GitHub invalide. Format attendu: https://github.com/owner/repo');
        setLoadingStack(false);
        return;
      }

      const { owner, repo } = repoInfo;

      // Fetch repository contents
      const contents = await fetchGitHubContent(owner, repo);
      if (!contents || contents.length === 0) {
        throw new Error('Impossible d\'accéder au contenu du repository. Vérifiez l\'URL et les permissions.');
      }

      // Find package.json
      const packageJsonFile = contents.find(file => file.name === 'package.json');
      if (!packageJsonFile || !packageJsonFile.download_url) {
        console.warn('package.json file not found or download_url missing');
        setValue('stack', 'JavaScript'); // Définir une valeur par défaut
        throw new Error('Impossible de trouver le fichier package.json dans le repository');
      }

      // Get package.json content
      const content = await fetchFileContent(packageJsonFile.download_url);
      let packageJson;
      try {
        packageJson = JSON.parse(content);
      } catch (error) {
        throw new Error('Erreur lors de la lecture du package.json. Vérifiez que le fichier est valide.');
      }

      // Extract dependencies
      const dependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ];

      // Map dependencies to tech stack
      const techMapping: Record<string, string> = {
        'react': 'React',
        'vue': 'Vue.js',
        'angular': 'Angular',
        'next': 'Next.js',
        'nuxt': 'Nuxt.js',
        'typescript': 'TypeScript',
        'tailwindcss': 'Tailwind CSS',
        'express': 'Express',
        'nestjs': 'NestJS',
        '@supabase/supabase-js': 'Supabase',
        'firebase': 'Firebase',
        'mongodb': 'MongoDB',
        'mysql2': 'MySQL',
        'pg': 'PostgreSQL',
        'vite': 'Vite',
        'webpack': 'Webpack',
        'jest': 'Jest',
        'vitest': 'Vitest',
        'cypress': 'Cypress',
        'playwright': 'Playwright',
        'storybook': 'Storybook',
        'graphql': 'GraphQL',
        'apollo': 'Apollo',
        'prisma': 'Prisma',
        'sequelize': 'Sequelize',
        'typeorm': 'TypeORM',
        'redux': 'Redux',
        'mobx': 'MobX',
        'zustand': 'Zustand',
        'jotai': 'Jotai',
        'recoil': 'Recoil',
        'styled-components': 'Styled Components',
        'emotion': 'Emotion',
        'sass': 'Sass',
        'less': 'Less',
        'postcss': 'PostCSS',
        'eslint': 'ESLint',
        'prettier': 'Prettier',
        'babel': 'Babel',
        'swc': 'SWC',
        'esbuild': 'esbuild',
        'rollup': 'Rollup',
        'parcel': 'Parcel',
        'docker': 'Docker',
        'kubernetes': 'Kubernetes',
        'aws-sdk': 'AWS SDK',
        'axios': 'Axios',
        'socket.io': 'Socket.IO',
        'websocket': 'WebSocket',
        'three': 'Three.js',
        'pixi.js': 'PixiJS',
        'phaser': 'Phaser',
        'tensorflow': 'TensorFlow',
        'pytorch': 'PyTorch',
        'opencv': 'OpenCV',
        'ffmpeg': 'FFmpeg',
        'sharp': 'Sharp',
        'imagemagick': 'ImageMagick',
        'pdf-lib': 'PDF Lib',
        'puppeteer': 'Puppeteer',
        'selenium': 'Selenium',
        'electron': 'Electron',
        'tauri': 'Tauri',
        'capacitor': 'Capacitor',
        'cordova': 'Cordova',
        'react-native': 'React Native',
        'flutter': 'Flutter',
        'ionic': 'Ionic',
        'nativescript': 'NativeScript',
      };

      const detectedTech = dependencies
        .map(dep => {
          for (const [pattern, tech] of Object.entries(techMapping)) {
            if (dep.toLowerCase().includes(pattern.toLowerCase())) return tech;
          }
          return null;
        })
        .filter((tech): tech is string => tech !== null);

      const uniqueTech = Array.from(new Set(detectedTech));
      setValue('stack', uniqueTech.join(', '));

    } catch (error) {
      console.error('Error detecting stack:', error);
      if (error instanceof Error) {
        setGithubError(error.message);
      } else {
        setGithubError('Erreur lors de la détection de la stack technique');
      }
    } finally {
      setLoadingStack(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1f2e] rounded-xl border border-white/10 shadow-2xl"
      >
        <div className="sticky top-0 z-50 flex items-center justify-between p-6 bg-[#1a1f2e] border-b border-white/10">
          <h2 className="text-xl font-bold">Configuration du projet</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSave)} className="space-y-8">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F6A469]">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titre*</label>
                  <input {...register('title')} type="text" className="input" />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select {...register('type')} className="input">
                    <option value="webapp" className="bg-background">Application Web</option>
                    <option value="mobile" className="bg-background">Application Mobile</option>
                    <option value="autre" className="bg-background">Autre</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea 
                    {...register('description')} 
                    className="input min-h-[100px]" 
                    placeholder="Description du projet..."
                  />
                </div>
              </div>
            </div>

            {/* Statut et dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F6A469]">Statut et dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Statut</label>
                  <select {...register('status')} className="input">
                    <option value="à faire" className="bg-background">À faire</option>
                    <option value="en cours" className="bg-background">En cours</option>
                    <option value="terminé" className="bg-background">Terminé</option>
                    <option value="en pause" className="bg-background">En pause</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date de début</label>
                  <input {...register('start_date')} type="date" className="input" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date de fin</label>
                  <input {...register('deadline')} type="date" className="input" />
                </div>
              </div>
            </div>

            {/* URLs et chemins */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F6A469]">URLs et chemins</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">URL GitHub</label>
                  <input {...register('github_url')} type="url" className="input" />
                  {(errors.github_url || githubError) && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <p>{errors.github_url?.message || githubError}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL de déploiement</label>
                  <input {...register('deploy_url')} type="url" className="input" />
                  {errors.deploy_url && (
                    <p className="mt-1 text-sm text-red-500">{errors.deploy_url.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Chemin local</label>
                  <input {...register('local_path')} type="text" className="input" />
                </div>
              </div>
            </div>

            {/* Hébergement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F6A469]">Hébergement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fournisseur</label>
                  <select {...register('hosting_provider')} className="input">
                    <option value="" className="bg-background">Sélectionner un fournisseur</option>
                    {HOSTING_PROVIDERS.map(provider => (
                      <option 
                        key={provider} 
                        value={provider}
                        className="bg-background capitalize"
                      >
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL de gestion</label>
                  <input {...register('hosting_url')} type="url" className="input" />
                  {errors.hosting_url && (
                    <p className="mt-1 text-sm text-red-500">{errors.hosting_url.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Base de données */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F6A469]">Base de données</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fournisseur</label>
                  <select {...register('database_provider')} className="input">
                    <option value="" className="bg-background">Aucun</option>
                    <option value="supabase" className="bg-background">Supabase</option>
                    <option value="firebase" className="bg-background">Firebase</option>
                    <option value="mongodb" className="bg-background">MongoDB</option>
                    <option value="mysql" className="bg-background">MySQL</option>
                    <option value="postgresql" className="bg-background">PostgreSQL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nom de la base</label>
                  <input {...register('database_name')} type="text" className="input" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">URL Supabase</label>
                  <input {...register('supabase_url')} type="url" className="input" />
                  {errors.supabase_url && (
                    <p className="mt-1 text-sm text-red-500">{errors.supabase_url.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Intelligence Artificielle */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F6A469]">Intelligence Artificielle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fournisseur IA</label>
                  <select {...register('ai_provider')} className="input">
                    <option value="" className="bg-background">Sélectionner un fournisseur</option>
                    {AI_PROVIDERS.map(provider => (
                      <option 
                        key={provider.name} 
                        value={provider.name}
                        className="bg-background"
                      >
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Modèle IA</label>
                  <select 
                    {...register('ai_model')} 
                    className="input"
                    disabled={!selectedProvider}
                  >
                    <option value="" className="bg-background">Sélectionner un modèle</option>
                    {selectedProvider && AI_PROVIDERS
                      .find(p => p.name === selectedProvider)
                      ?.models.map(model => (
                        <option 
                          key={model} 
                          value={model}
                          className="bg-background"
                        >
                          {model}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Clé API IA</label>
                  <input {...register('ai_api_key')} type="password" className="input" />
                </div>
              </div>
            </div>

            {/* Stack technique */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#F6A469]">Stack technique</h3>
              <div className="relative">
                <input 
                  {...register('stack')} 
                  type="text" 
                  className="input pr-10" 
                  placeholder="React, Node.js, TypeScript..."
                />
                {loadingStack && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#F6A469]" />
                  </div>
                )}
              </div>
              <p className="text-sm text-white/60">
                La stack technique est détectée automatiquement à partir du fichier package.json de votre repository GitHub
              </p>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-4 pt-4 border-t border-white/10 bg-[#1a1f2e] pb-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}