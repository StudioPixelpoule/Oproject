import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Plus, Save, X, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const dependencySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  version: z.string().min(1, 'La version est requise'),
  type: z.enum(['production', 'development']),
  description: z.string().optional(),
  homepage: z.string().url('URL invalide').optional().nullable(),
});

type DependencyFormData = z.infer<typeof dependencySchema>;

interface Dependency {
  id: string;
  project_id: string;
  name: string;
  version: string;
  type: 'production' | 'development';
  description: string | null;
  homepage: string | null;
  created_at: string;
  user_id: string;
}

interface DependenciesSectionProps {
  projectId: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export default function DependenciesSection({ projectId }: DependenciesSectionProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showNewDependencyForm, setShowNewDependencyForm] = useState(false);
  const [editingDependencyId, setEditingDependencyId] = useState<string | null>(null);
  const [expandedDeps, setExpandedDeps] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DependencyFormData>({
    resolver: zodResolver(dependencySchema),
    defaultValues: {
      type: 'production',
    },
  });

  useEffect(() => {
    fetchDependencies();
  }, [projectId]);

  async function fetchDependencies() {
    try {
      const { data, error } = await supabase
        .from('dependencies')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDependencies(data || []);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      toast.error('Erreur lors du chargement des dépendances');
    } finally {
      setLoading(false);
    }
  }

  const syncWithGitHub = async () => {
    try {
      setSyncing(true);

      // Get user ID first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch project details to get GitHub URL
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('github_url')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      if (!project?.github_url) {
        toast.error('URL GitHub non configurée');
        return;
      }

      // Parse GitHub URL to get owner and repo
      const match = project.github_url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        toast.error('URL GitHub invalide');
        return;
      }

      const [, owner, repo] = match;

      // Fetch package.json from GitHub
      const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`);
      if (!response.ok) {
        throw new Error('Impossible de récupérer le package.json');
      }

      const packageJson: PackageJson = await response.json();

      // Prepare dependencies to sync
      const depsToSync = [];

      // Add production dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          depsToSync.push({
            project_id: projectId,
            name,
            version,
            type: 'production' as const,
            homepage: `https://www.npmjs.com/package/${name}`,
            user_id: user.id,
          });
        }
      }

      // Add development dependencies
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(packageJson.devDependencies)) {
          depsToSync.push({
            project_id: projectId,
            name,
            version,
            type: 'development' as const,
            homepage: `https://www.npmjs.com/package/${name}`,
            user_id: user.id,
          });
        }
      }

      // Delete existing dependencies
      const { error: deleteError } = await supabase
        .from('dependencies')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Insert new dependencies
      if (depsToSync.length > 0) {
        const { error: insertError } = await supabase
          .from('dependencies')
          .insert(depsToSync);

        if (insertError) throw insertError;
      }

      toast.success('Dépendances synchronisées avec GitHub');
      fetchDependencies();
    } catch (error) {
      console.error('Error syncing with GitHub:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const onSubmit = async (data: DependencyFormData) => {
    try {
      // Get user ID first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (editingDependencyId) {
        const { error } = await supabase
          .from('dependencies')
          .update(data)
          .eq('id', editingDependencyId);

        if (error) throw error;
        toast.success('Dépendance mise à jour');
      } else {
        const { error } = await supabase
          .from('dependencies')
          .insert([{
            project_id: projectId,
            ...data,
            user_id: user.id,
          }]);

        if (error) throw error;
        toast.success('Dépendance ajoutée');
      }

      reset();
      setEditingDependencyId(null);
      setShowNewDependencyForm(false);
      fetchDependencies();
    } catch (error) {
      console.error('Error saving dependency:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const deleteDependency = async (depId: string) => {
    try {
      const { error } = await supabase
        .from('dependencies')
        .delete()
        .eq('id', depId);

      if (error) throw error;
      toast.success('Dépendance supprimée');
      fetchDependencies();
    } catch (error) {
      console.error('Error deleting dependency:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEditing = (dep: Dependency) => {
    setEditingDependencyId(dep.id);
    reset({
      name: dep.name,
      version: dep.version,
      type: dep.type,
      description: dep.description || '',
      homepage: dep.homepage || '',
    });
    setShowNewDependencyForm(true);
  };

  const toggleExpanded = (depId: string) => {
    const newExpanded = new Set(expandedDeps);
    if (newExpanded.has(depId)) {
      newExpanded.delete(depId);
    } else {
      newExpanded.add(depId);
    }
    setExpandedDeps(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dépendances</h3>
        <div className="flex gap-2">
          <button
            onClick={syncWithGitHub}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Synchroniser avec GitHub
          </button>
          {!showNewDependencyForm && (
            <button
              onClick={() => setShowNewDependencyForm(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle dépendance
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {showNewDependencyForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit(onSubmit)}
            className="card bg-white/10"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom du package*
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="input"
                  placeholder="@types/react"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Version*
                </label>
                <input
                  {...register('version')}
                  type="text"
                  className="input"
                  placeholder="^18.0.0"
                />
                {errors.version && (
                  <p className="text-red-500 text-sm mt-1">{errors.version.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type
                </label>
                <select {...register('type')} className="input">
                  <option value="production" className="bg-background">Production</option>
                  <option value="development" className="bg-background">Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="input"
                  placeholder="Description de la dépendance..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Page du package
                </label>
                <input
                  {...register('homepage')}
                  type="url"
                  className="input"
                  placeholder="https://www.npmjs.com/package/react"
                />
                {errors.homepage && (
                  <p className="text-red-500 text-sm mt-1">{errors.homepage.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowNewDependencyForm(false);
                  setEditingDependencyId(null);
                  reset();
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingDependencyId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </motion.form>
        )}

        {dependencies.map((dep) => (
          <motion.div
            key={dep.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-white/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Package className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold font-mono">{dep.name}</h4>
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-sm font-mono">
                      {dep.version}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-sm ${
                      dep.type === 'production'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-secondary/20 text-secondary'
                    }`}>
                      {dep.type}
                    </span>
                  </div>
                  <p className="text-sm text-white/40">
                    Ajoutée le {new Date(dep.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {dep.homepage && (
                  <a
                    href={dep.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => toggleExpanded(dep.id)}
                  className="btn-secondary"
                >
                  {expandedDeps.has(dep.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => startEditing(dep)}
                  className="btn-secondary"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteDependency(dep.id)}
                  className="btn-secondary bg-red-500/20 hover:bg-red-500/30 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedDeps.has(dep.id) && dep.description && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <p className="text-white/80">{dep.description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {dependencies.length === 0 && !showNewDependencyForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-white/60"
          >
            Aucune dépendance enregistrée
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}