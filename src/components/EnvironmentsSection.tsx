import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings2, Plus, Save, X, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const envSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  variables: z.array(z.object({
    key: z.string().min(1, 'La clé est requise'),
    value: z.string().min(1, 'La valeur est requise'),
  })).min(1, 'Au moins une variable est requise'),
});

type EnvFormData = z.infer<typeof envSchema>;

interface Environment {
  id: string;
  project_id: string;
  name: string;
  variables: Array<{ key: string; value: string; }>;
  created_at: string;
  user_id: string;
}

interface EnvironmentsSectionProps {
  projectId: string;
}

const defaultEnvironments = [
  'development',
  'staging',
  'production',
];

export default function EnvironmentsSection({ projectId }: EnvironmentsSectionProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEnvForm, setShowNewEnvForm] = useState(false);
  const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
  const [expandedEnvs, setExpandedEnvs] = useState<Set<string>>(new Set());
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EnvFormData>({
    resolver: zodResolver(envSchema),
    defaultValues: {
      variables: [{ key: '', value: '' }],
    },
  });

  const variables = watch('variables');

  useEffect(() => {
    fetchEnvironments();
  }, [projectId]);

  async function fetchEnvironments() {
    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnvironments(data || []);
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast.error('Erreur lors du chargement des environnements');
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: EnvFormData) => {
    try {
      const variables = data.variables.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (editingEnvId) {
        const { error } = await supabase
          .from('environments')
          .update({
            name: data.name,
            variables,
          })
          .eq('id', editingEnvId);

        if (error) throw error;
        toast.success('Environnement mis à jour');
      } else {
        const { error } = await supabase
          .from('environments')
          .insert([{
            project_id: projectId,
            name: data.name,
            variables,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          }]);

        if (error) throw error;
        toast.success('Environnement ajouté');
      }

      reset();
      setEditingEnvId(null);
      setShowNewEnvForm(false);
      fetchEnvironments();
    } catch (error) {
      console.error('Error saving environment:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const deleteEnvironment = async (envId: string) => {
    try {
      const { error } = await supabase
        .from('environments')
        .delete()
        .eq('id', envId);

      if (error) throw error;
      toast.success('Environnement supprimé');
      fetchEnvironments();
    } catch (error) {
      console.error('Error deleting environment:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEditing = (env: Environment) => {
    setEditingEnvId(env.id);
    reset({
      name: env.name,
      variables: Object.entries(env.variables).map(([key, value]) => ({ key, value })),
    });
    setShowNewEnvForm(true);
  };

  const toggleExpanded = (envId: string) => {
    const newExpanded = new Set(expandedEnvs);
    if (newExpanded.has(envId)) {
      newExpanded.delete(envId);
    } else {
      newExpanded.add(envId);
    }
    setExpandedEnvs(newExpanded);
  };

  const toggleValueVisibility = (key: string) => {
    const newHidden = new Set(hiddenValues);
    if (newHidden.has(key)) {
      newHidden.delete(key);
    } else {
      newHidden.add(key);
    }
    setHiddenValues(newHidden);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copié !');
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const addVariable = () => {
    const currentVars = watch('variables');
    setValue('variables', [...currentVars, { key: '', value: '' }]);
  };

  const removeVariable = (index: number) => {
    const currentVars = watch('variables');
    setValue('variables', currentVars.filter((_, i) => i !== index));
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
        <h3 className="text-lg font-semibold">Environnements</h3>
        {!showNewEnvForm && (
          <button
            onClick={() => setShowNewEnvForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel environnement
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {showNewEnvForm && (
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
                  Nom de l'environnement*
                </label>
                <select
                  {...register('name')}
                  className="input"
                  defaultValue=""
                >
                  <option value="" disabled className="bg-background">Sélectionner un environnement</option>
                  {defaultEnvironments.map(env => (
                    <option
                      key={env}
                      value={env}
                      className="bg-background"
                    >
                      {env}
                    </option>
                  ))}
                </select>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Variables d'environnement*
                </label>
                <div className="space-y-4">
                  {variables.map((_, index) => (
                    <div key={index} className="flex gap-4">
                      <input
                        {...register(`variables.${index}.key`)}
                        type="text"
                        className="input flex-1"
                        placeholder="VITE_API_KEY"
                      />
                      <input
                        {...register(`variables.${index}.value`)}
                        type="text"
                        className="input flex-1"
                        placeholder="your-api-key"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariable(index)}
                        className="btn-secondary text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {errors.variables && (
                    <p className="text-red-500 text-sm">{errors.variables.message}</p>
                  )}
                  <button
                    type="button"
                    onClick={addVariable}
                    className="btn-secondary w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une variable
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowNewEnvForm(false);
                  setEditingEnvId(null);
                  reset();
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingEnvId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </motion.form>
        )}

        {environments.map((env) => (
          <motion.div
            key={env.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-white/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Settings2 className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold capitalize mb-2">{env.name}</h4>
                  <p className="text-sm text-white/40">
                    Créé le {new Date(env.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleExpanded(env.id)}
                  className="btn-secondary"
                >
                  {expandedEnvs.has(env.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => startEditing(env)}
                  className="btn-secondary"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEnvironment(env.id)}
                  className="btn-secondary bg-red-500/20 hover:bg-red-500/30 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedEnvs.has(env.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="space-y-4">
                    {Object.entries(env.variables).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-4">
                        <code className="bg-white/5 px-3 py-2 rounded flex-1">
                          {key}
                        </code>
                        <code className="bg-white/5 px-3 py-2 rounded flex-1 font-mono">
                          {hiddenValues.has(key) ? '••••••••' : value}
                        </code>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleValueVisibility(key)}
                            className="p-2 rounded hover:bg-white/10 transition-colors"
                          >
                            {hiddenValues.has(key) ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(value)}
                            className="p-2 rounded hover:bg-white/10 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {environments.length === 0 && !showNewEnvForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-white/60"
          >
            Aucun environnement configuré
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}