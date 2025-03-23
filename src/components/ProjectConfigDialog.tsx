import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Project, ProjectType, ProjectStatus, DatabaseProvider } from '../types/database';

const projectSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  type: z.enum(['webapp', 'mobile', 'autre'] as const),
  status: z.enum(['à faire', 'en cours', 'terminé', 'en pause'] as const),
  start_date: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  stack: z.string().optional(),
  github_url: z.string().url('URL GitHub invalide').optional().nullable(),
  deploy_url: z.string().url('URL de déploiement invalide').optional().nullable(),
  database_provider: z.enum(['supabase', 'firebase', 'mongodb', 'mysql', 'postgresql'] as const).optional().nullable(),
  database_name: z.string().optional().nullable(),
  supabase_url: z.string().url('URL Supabase invalide').optional().nullable(),
  local_path: z.string().optional().nullable(),
  ai_provider: z.string().optional().nullable(),
  ai_model: z.string().optional().nullable(),
  ai_api_key: z.string().optional().nullable(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectConfigDialogProps {
  project: Project;
  onClose: () => void;
  onSave: (data: ProjectFormData) => Promise<void>;
}

export default function ProjectConfigDialog({ project, onClose, onSave }: ProjectConfigDialogProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>({
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
      database_provider: project.database_provider,
      database_name: project.database_name,
      supabase_url: project.supabase_url,
      local_path: project.local_path,
      ai_provider: project.ai_provider,
      ai_model: project.ai_model,
      ai_api_key: project.ai_api_key,
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="modal-content"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Configuration du projet</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Titre*</label>
            <input {...register('title')} type="text" className="input" />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea {...register('description')} className="input min-h-[100px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select {...register('type')} className="input">
                <option value="webapp">Application Web</option>
                <option value="mobile">Application Mobile</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select {...register('status')} className="input">
                <option value="à faire">À faire</option>
                <option value="en cours">En cours</option>
                <option value="terminé">Terminé</option>
                <option value="en pause">En pause</option>
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

          <div>
            <label className="block text-sm font-medium mb-2">Stack technique</label>
            <input {...register('stack')} type="text" className="input" placeholder="React, Node.js, TypeScript..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">URL GitHub</label>
              <input {...register('github_url')} type="url" className="input" />
              {errors.github_url && (
                <p className="mt-1 text-sm text-red-500">{errors.github_url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">URL de déploiement</label>
              <input {...register('deploy_url')} type="url" className="input" />
              {errors.deploy_url && (
                <p className="mt-1 text-sm text-red-500">{errors.deploy_url.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Base de données</label>
              <select {...register('database_provider')} className="input">
                <option value="">Aucune</option>
                <option value="supabase">Supabase</option>
                <option value="firebase">Firebase</option>
                <option value="mongodb">MongoDB</option>
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nom de la base</label>
              <input {...register('database_name')} type="text" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">URL Supabase</label>
            <input {...register('supabase_url')} type="url" className="input" />
            {errors.supabase_url && (
              <p className="mt-1 text-sm text-red-500">{errors.supabase_url.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Chemin local</label>
            <input {...register('local_path')} type="text" className="input" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fournisseur IA</label>
              <input {...register('ai_provider')} type="text" className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Modèle IA</label>
              <input {...register('ai_model')} type="text" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Clé API IA</label>
            <input {...register('ai_api_key')} type="password" className="input" />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}