import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Plus, Save, X, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchGitHubContent, fetchFileContent } from '../lib/github';
import { parseGitHubUrl } from '../lib/api-config';
import toast from 'react-hot-toast';
import * as semver from 'semver';

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
  latestVersion?: string;
  hasUpdate?: boolean;
}

interface DependencyWithVersion extends Dependency {
  latestVersion?: string;
  hasUpdate?: boolean;
}

interface DependenciesSectionProps {
  projectId: string;
}

export default function DependenciesSection({ projectId }: DependenciesSectionProps) {
  const [dependencies, setDependencies] = useState<DependencyWithVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
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

  const checkForUpdates = async () => {
    try {
      setCheckingUpdates(true);
      const updatedDeps = await Promise.all(
        dependencies.map(async (dep) => {
          try {
            const response = await fetch(`https://registry.npmjs.org/${dep.name}`);
            if (!response.ok) {
              throw new Error(`Error fetching package info: ${response.statusText}`);
            }
            
            const data = await response.json();
            const latestVersion = data['dist-tags']?.latest;
            
            if (!latestVersion) {
              return dep;
            }

            const currentVersion = semver.clean(dep.version.replace(/[\^~]/, '')) || dep.version;
            const cleanLatestVersion = semver.clean(latestVersion) || latestVersion;

            const hasUpdate = semver.valid(currentVersion) && 
                            semver.valid(cleanLatestVersion) && 
                            semver.gt(cleanLatestVersion, currentVersion);

            return {
              ...dep,
              latestVersion: cleanLatestVersion,
              hasUpdate,
            };
          } catch (error) {
            console.error(`Error checking updates for ${dep.name}:`, error);
            return dep;
          }
        })
      );

      setDependencies(updatedDeps);
      toast.success('Versions vérifiées avec succès');
    } catch (error) {
      console.error('Error checking for updates:', error);
      toast.error('Erreur lors de la vérification des mises à jour');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const onSubmit = async (data: DependencyFormData) => {
    try {
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

  const syncWithGitHub = async () => {
    try {
      setSyncing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('github_url')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      if (!project?.github_url) {
        throw new Error('URL GitHub non configurée. Ajoutez l\'URL GitHub dans les paramètres du projet.');
      }

      const repoInfo = parseGitHubUrl(project.github_url);
      if (!repoInfo) {
        throw new Error('URL GitHub invalide. Format attendu: https://github.com/owner/repo');
      }

      const { owner, repo } = repoInfo;

      const contents = await fetchGitHubContent(owner, repo);
      if (!contents || contents.length === 0) {
        throw new Error('Impossible d\'accéder au contenu du repository. Vérifiez l\'URL et les permissions.');
      }

      const packageJsonFile = contents.find(file => file.name === 'package.json');
      if (!packageJsonFile) {
        throw new Error('package.json introuvable dans le repository.');
      }

      const packageJsonContent = await fetchFileContent(packageJsonFile.download_url);
      let packageJson;
      try {
        packageJson = JSON.parse(packageJsonContent);
      } catch (error) {
        throw new Error('Erreur lors de la lecture du package.json. Vérifiez que le fichier est valide.');
      }

      const depsToSync = [];

      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          depsToSync.push({
            project_id: projectId,
            name,
            version: version as string,
            type: 'production',
            homepage: `https://www.npmjs.com/package/${name}`,
            user_id: user.id,
          });
        }
      }

      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(packageJson.devDependencies)) {
          depsToSync.push({
            project_id: projectId,
            name,
            version: version as string,
            type: 'development',
            homepage: `https://www.npmjs.com/package/${name}`,
            user_id: user.id,
          });
        }
      }

      if (depsToSync.length === 0) {
        throw new Error('Aucune dépendance trouvée dans le package.json');
      }

      const { error: deleteError } = await supabase
        .from('dependencies')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('dependencies')
        .insert(depsToSync);

      if (insertError) throw insertError;

      toast.success('Dépendances synchronisées avec GitHub');
      fetchDependencies();
    } catch (error) {
      console.error('Error syncing with GitHub:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la synchronisation');
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#F6A469]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dépendances</h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkForUpdates}
            className="btn-secondary h-9 px-3 text-sm"
            disabled={checkingUpdates}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${checkingUpdates ? 'animate-spin' : ''}`} />
            Vérifier les mises à jour
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewDependencyForm(true)}
            className="btn-secondary h-9 px-3 text-sm"
            disabled={showNewDependencyForm}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvelle
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={syncWithGitHub}
            className="btn-secondary h-9 px-3 text-sm"
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            Synchroniser avec GitHub
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {showNewDependencyForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit(onSubmit)}
            className="card bg-white/5"
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setShowNewDependencyForm(false);
                  setEditingDependencyId(null);
                  reset();
                }}
                className="btn-secondary h-9 px-3 text-sm"
              >
                <X className="w-4 h-4 mr-1.5" />
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-primary h-9 px-3 text-sm"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {editingDependencyId ? 'Mettre à jour' : 'Ajouter'}
              </motion.button>
            </div>
          </motion.form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dependencies.map((dep) => (
            <motion.div
              key={dep.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card bg-white/5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Package className="w-5 h-5 text-[#F6A469] mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-lg font-semibold font-mono truncate">{dep.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-sm font-mono">
                        {dep.version}
                      </span>
                      {dep.hasUpdate && (
                        <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-500 text-sm font-mono flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {dep.latestVersion} disponible
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-lg text-sm ${
                        dep.type === 'production'
                          ? 'bg-[#F6A469]/20 text-[#F6A469]'
                          : 'bg-[#DA8680]/20 text-[#DA8680]'
                      }`}>
                        {dep.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {dep.homepage && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={dep.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleExpanded(dep.id)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {expandedDeps.has(dep.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startEditing(dep)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteDependency(dep.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
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
        </div>

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