import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Book, Plus, Save, X, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateDocumentation } from '../lib/openai';
import { fetchGitHubContent, fetchFileContent } from '../lib/github';
import { parseGitHubUrl } from '../lib/api-config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const docSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  category: z.enum(['technique', 'utilisation', 'api', 'architecture', 'configuration']),
});

type DocFormData = z.infer<typeof docSchema>;

interface Documentation {
  id: string;
  project_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  user_id: string;
}

interface DocumentationSectionProps {
  projectId: string;
}

const categories = [
  { value: 'technique', label: 'Documentation technique' },
  { value: 'utilisation', label: 'Guide d\'utilisation' },
  { value: 'api', label: 'API' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'configuration', label: 'Configuration' },
];

export default function DocumentationSection({ projectId }: DocumentationSectionProps) {
  const { session } = useAuth();
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DocFormData>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      category: 'technique',
    },
  });

  useEffect(() => {
    fetchDocs();
  }, [projectId]);

  async function fetchDocs() {
    try {
      const { data, error } = await supabase
        .from('documentation')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error('Error fetching documentation:', error);
      toast.error('Erreur lors du chargement de la documentation');
    } finally {
      setLoading(false);
    }
  }

  const syncWithGitHub = async () => {
    try {
      setSyncing(true);

      if (!session?.user) {
        throw new Error('Utilisateur non authentifié');
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
        throw new Error('Aucun fichier pertinent trouvé pour la documentation');
      }

      const files = await Promise.all(
        contents.map(async (file: any) => {
          try {
            const content = await fetchFileContent(file.download_url);
            return {
              name: file.name,
              content,
            };
          } catch (error) {
            console.error(`Error fetching ${file.name}:`, error);
            return null;
          }
        })
      );

      const validFiles = files.filter((f): f is { name: string; content: string } => f !== null);

      if (validFiles.length === 0) {
        throw new Error('Impossible de récupérer le contenu des fichiers');
      }

      const documentation = await generateDocumentation(validFiles);

      const { error: insertError } = await supabase
        .from('documentation')
        .insert([{
          project_id: projectId,
          title: 'Documentation technique',
          content: documentation,
          category: 'technique',
          user_id: session.user.id,
        }]);

      if (insertError) throw insertError;

      toast.success('Documentation générée avec succès');
      fetchDocs();
    } catch (error) {
      console.error('Error syncing with GitHub:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erreur lors de la synchronisation avec GitHub');
      }
    } finally {
      setSyncing(false);
    }
  };

  const onSubmit = async (data: DocFormData) => {
    try {
      if (!session?.user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (editingDocId) {
        const { error } = await supabase
          .from('documentation')
          .update(data)
          .eq('id', editingDocId);

        if (error) throw error;
        toast.success('Documentation mise à jour');
      } else {
        const { error } = await supabase
          .from('documentation')
          .insert([{
            project_id: projectId,
            ...data,
            user_id: session.user.id,
          }]);

        if (error) throw error;
        toast.success('Documentation ajoutée');
      }

      reset();
      setEditingDocId(null);
      setShowNewDocForm(false);
      fetchDocs();
    } catch (error) {
      console.error('Error saving documentation:', error);
      toast.error('Erreur lors de l\'enregistrement de la documentation');
    }
  };

  const deleteDoc = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documentation')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      toast.success('Documentation supprimée');
      fetchDocs();
    } catch (error) {
      console.error('Error deleting documentation:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEditing = (doc: Documentation) => {
    setEditingDocId(doc.id);
    reset({
      title: doc.title,
      content: doc.content,
      category: doc.category as DocFormData['category'],
    });
    setShowNewDocForm(true);
  };

  const toggleExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
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
        <h3 className="text-lg font-semibold">Documentation</h3>
        <div className="flex gap-2">
          <button
            onClick={syncWithGitHub}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Générer avec GitHub
          </button>
          {!showNewDocForm && (
            <button
              onClick={() => setShowNewDocForm(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle documentation
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {showNewDocForm && (
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
                  Titre*
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="input"
                  placeholder="Titre de la documentation"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Catégorie
                </label>
                <select {...register('category')} className="input">
                  {categories.map(category => (
                    <option 
                      key={category.value} 
                      value={category.value}
                      className="bg-background"
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Contenu* (Markdown supporté)
                </label>
                <textarea
                  {...register('content')}
                  className="input min-h-[300px] font-mono"
                  placeholder="# Titre&#10;## Sous-titre&#10;- Liste à puces&#10;1. Liste numérotée&#10;&#10;**Gras** et *italique*"
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowNewDocForm(false);
                  setEditingDocId(null);
                  reset();
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingDocId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </motion.form>
        )}

        {docs.map((doc) => (
          <motion.div
            key={doc.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-white/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Book className="w-5 h-5 text-[#F6A469] mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold">{doc.title}</h4>
                    <span className="px-2 py-1 rounded-lg bg-white/5 text-sm">
                      {categories.find(c => c.value === doc.category)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-white/40">
                    Créée le {new Date(doc.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleExpanded(doc.id)}
                  className="btn-secondary"
                >
                  {expandedDocs.has(doc.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => startEditing(doc)}
                  className="btn-secondary"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteDoc(doc.id)}
                  className="btn-secondary bg-red-500/20 hover:bg-red-500/30 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedDocs.has(doc.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {docs.length === 0 && !showNewDocForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-white/60"
          >
            Aucune documentation pour le moment
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}