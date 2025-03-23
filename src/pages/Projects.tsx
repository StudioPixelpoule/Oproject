import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderGit2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Project } from '../types/database';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Projets</h1>
            <p className="text-white/60">
              {projects.length} projet{projects.length !== 1 && 's'}
            </p>
          </div>

          <button
            onClick={() => navigate('/projects/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau projet
          </button>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card flex flex-col items-center justify-center py-12"
          >
            <FolderGit2 className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun projet</h3>
            <p className="text-white/60 mb-6">
              Commencez par créer votre premier projet
            </p>
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Créer un projet
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="card cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                {project.description && (
                  <p className="text-white/60 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-sm">
                    {project.status}
                  </span>
                  <span className="text-white/40 text-sm">
                    {project.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}