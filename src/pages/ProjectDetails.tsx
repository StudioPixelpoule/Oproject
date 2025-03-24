import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Info, StickyNote, FileArchive, Settings, Loader2, ListTodo, Book, Settings2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project } from '../types/database';
import NotesSection from '../components/NotesSection';
import VersionsSection from '../components/VersionsSection';
import TasksSection from '../components/TasksSection';
import DocumentationSection from '../components/DocumentationSection';
import EnvironmentsSection from '../components/EnvironmentsSection';
import DependenciesSection from '../components/DependenciesSection';
import ProjectHeader from '../components/ProjectHeader';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import ProjectInfoTab from '../components/ProjectInfoTab';
import ProjectConfigDialog from '../components/ProjectConfigDialog';

type TabType = 'info' | 'tasks' | 'notes' | 'versions' | 'docs' | 'envs' | 'deps';

interface TabConfig {
  id: TabType;
  label: string;
  icon: typeof Info;
  description: string;
}

const tabs: TabConfig[] = [
  { 
    id: 'info', 
    label: 'Informations', 
    icon: Info,
    description: 'Détails et configuration du projet'
  },
  { 
    id: 'tasks', 
    label: 'Tâches', 
    icon: ListTodo,
    description: 'Gestion des tâches et suivi'
  },
  { 
    id: 'notes', 
    label: 'Notes', 
    icon: StickyNote,
    description: 'Notes et commentaires'
  },
  { 
    id: 'versions', 
    label: 'Versions', 
    icon: FileArchive,
    description: 'Gestion des versions du projet'
  },
  { 
    id: 'docs', 
    label: 'Documentation', 
    icon: Book,
    description: 'Documentation technique'
  },
  { 
    id: 'envs', 
    label: 'Environnements', 
    icon: Settings2,
    description: 'Configuration des environnements'
  },
  { 
    id: 'deps', 
    label: 'Dépendances', 
    icon: Package,
    description: 'Gestion des dépendances'
  },
];

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [hoveredTab, setHoveredTab] = useState<TabType | null>(null);

  React.useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

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

  const updateProject = async (data: Partial<Project>) => {
    if (!project?.id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', project.id);

      if (error) throw error;

      setShowConfigDialog(false);
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

  const renderTabContent = () => {
    if (!project) return null;

    switch (activeTab) {
      case 'info':
        return (
          <ProjectInfoTab
            project={project}
            showApiKey={showApiKey}
            onToggleApiKey={() => setShowApiKey(!showApiKey)}
            onCopy={copyToClipboard}
          />
        );
      case 'tasks':
        return <TasksSection projectId={project.id} />;
      case 'notes':
        return <NotesSection projectId={project.id} />;
      case 'versions':
        return <VersionsSection projectId={project.id} />;
      case 'docs':
        return <DocumentationSection projectId={project.id} />;
      case 'envs':
        return <EnvironmentsSection projectId={project.id} />;
      case 'deps':
        return <DependenciesSection projectId={project.id} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F6A469]" />
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
            onClick={() => setShowConfigDialog(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
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

          <div className="relative">
            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto pb-4 mb-6 gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-[#F6A469] text-[#1a1f2e] shadow-lg shadow-[#F6A469]/20' 
                        : 'hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    
                    {/* Tooltip */}
                    <AnimatePresence>
                      {hoveredTab === tab.id && !isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute left-1/2 -translate-x-1/2 -bottom-12 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm whitespace-nowrap z-50"
                        >
                          {tab.description}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmDialog
            onConfirm={deleteProject}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
        {showConfigDialog && project && (
          <ProjectConfigDialog
            project={project}
            onClose={() => setShowConfigDialog(false)}
            onSave={updateProject}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}