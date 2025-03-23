import React from 'react';
import { Calendar, Database, Copy, Eye, EyeOff, GitBranch, GitCommit, GitPullRequest } from 'lucide-react';
import type { Project } from '../types/database';

interface ProjectInfoTabProps {
  project: Project;
  showApiKey: boolean;
  onToggleApiKey: () => void;
  onCopy: (text: string) => void;
}

export default function ProjectInfoTab({ project, showApiKey, onToggleApiKey, onCopy }: ProjectInfoTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {project.stack && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Stack technique</h3>
          <div className="flex flex-wrap gap-2">
            {project.stack.split(',').map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-lg bg-white/5 text-white/80"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Dates</h3>
        <div className="space-y-2">
          {project.start_date && (
            <div className="flex items-center gap-2 text-white/80">
              <Calendar className="w-5 h-5" />
              <span>Début : {new Date(project.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {project.deadline && (
            <div className="flex items-center gap-2 text-white/80">
              <Calendar className="w-5 h-5" />
              <span>Deadline : {new Date(project.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {project.database_provider && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Base de données</h3>
          <div className="flex items-center gap-2 text-white/80">
            <Database className="w-5 h-5" />
            <div>
              <p className="capitalize">{project.database_provider}</p>
              {project.database_name && (
                <p className="text-sm text-white/60">
                  Base : {project.database_name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {project.local_path && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Chemin local</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm flex-1">{project.local_path}</p>
              <button
                onClick={() => onCopy(project.local_path)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {[
                { icon: GitBranch, command: 'git status' },
                { icon: GitCommit, command: 'git add .' },
                { icon: GitBranch, command: 'git status' },
                { icon: GitCommit, command: 'git commit -m "Mises à jour"' },
                { icon: GitPullRequest, command: 'git push origin main' },
              ].map((git, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <git.icon className="w-4 h-4" />
                  <code className="text-sm bg-white/5 px-2 py-1 rounded flex-1">
                    {git.command}
                  </code>
                  <button
                    onClick={() => onCopy(git.command)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    title="Copier la commande"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {project.ai_provider && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Intelligence Artificielle</h3>
          <div className="space-y-2">
            <p className="text-white/80">
              Fournisseur : {project.ai_provider}
            </p>
            {project.ai_model && (
              <p className="text-white/80">
                Modèle : {project.ai_model}
              </p>
            )}
            {project.ai_api_key && (
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm flex-1">
                  {showApiKey ? project.ai_api_key : '••••••••••••••••'}
                </p>
                <button
                  onClick={onToggleApiKey}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onCopy(project.ai_api_key)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}