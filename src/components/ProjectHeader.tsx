import React from 'react';
import { Github, ExternalLink, Database, Trash2, Cloud } from 'lucide-react';
import type { Project } from '../types/database';

interface ProjectHeaderProps {
  project: Project;
  onDelete: () => void;
}

export default function ProjectHeader({ project, onDelete }: ProjectHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary">
            {project.status}
          </span>
          <span className="text-white/60">{project.type}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <Github className="w-5 h-5" />
            GitHub
          </a>
        )}
        {project.deploy_url && (
          <a
            href={project.deploy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Site
          </a>
        )}
        {project.hosting_url && (
          <a
            href={project.hosting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <Cloud className="w-5 h-5" />
            Hébergement
          </a>
        )}
        {project.database_provider === 'supabase' && project.supabase_url && (
          <a
            href={project.supabase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <Database className="w-5 h-5" />
            Supabase
          </a>
        )}
        <button
          onClick={onDelete}
          className="btn-secondary bg-red-500/20 hover:bg-red-500/30 text-red-500"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}