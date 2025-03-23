import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Info, StickyNote, FileArchive, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project, ProjectType, ProjectStatus, DatabaseProvider, AI_PROVIDERS } from '../types/database';
import NotesSection from '../components/NotesSection';
import VersionsSection from '../components/VersionsSection';
import ProjectHeader from '../components/ProjectHeader';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import ProjectInfoTab from '../components/ProjectInfoTab';

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
type TabType = 'info' | 'notes' | 'versions';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  React.useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  React.useEffect(() => {
    if (project && !isEditing) {
      Object.entries(project).forEach(([key, value]) => {
        setValue(key as keyof ProjectFormData, value);
      });
    }
  }, [project, isEditing, setValue]);

  async function fetchProjectData() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject() {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Projet supprimé');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erreur lors de la suppression du projet');
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (!project?.id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', project.id);

      if (error) throw error;

      setIsEditing(false);
      fetchProjectData();
      toast.success('Projet mis à jour');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Erreur lors de la mise à jour du projet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]).then(() => {
      toast.success('Copié !');
    }).catch(() => {
      toast.error('Erreur lors de la copie');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au tableau de bord
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Configurer
          </button>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card"
        >
          <ProjectHeader 
            project={project} 
            onDelete={() => setShowDeleteConfirm(true)} 
          />

          {project.description && (
            <p className="text-white/80 mb-6">{project.description}</p>
          )}

          <div className="border-b border-white/10 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-2 px-1 flex items-center gap-2 transition-colors relative ${
                  activeTab === 'info'
                    ? 'text-primary'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Info className="w-4 h-4" />
                Informations
                {activeTab === 'info' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-2 px-1 flex items-center gap-2 transition-colors relative ${
                  activeTab === 'notes'
                    ? 'text-primary'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <StickyNote className="w-4 h-4" />
                Notes
                {activeTab === 'notes' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`pb-2 px-1 flex items-center gap-2 transition-colors relative ${
                  activeTab === 'versions'
                    ? 'text-primary'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <FileArchive className="w-4 h-4" />
                Versions
                {activeTab === 'versions' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ProjectInfoTab
                  project={project}
                  showApiKey={showApiKey}
                  onToggleApiKey={() => setShowApiKey(!showApiKey)}
                  onCopy={copyToClipboard}
                />
              </motion.div>
            )}
            {activeTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotesSection projectId={project.id} />
              </motion.div>
            )}
            {activeTab === 'versions' && (
              <motion.div
                key="versions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <VersionsSection projectId={project.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmDialog
            onConfirm={deleteProject}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}