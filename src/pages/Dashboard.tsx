import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FolderGit2, Users, Database, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  {
    id: 'projects',
    name: 'Projets',
    description: 'Gérez vos projets de développement',
    icon: FolderGit2,
    color: 'from-primary/20 to-secondary/20',
    textColor: 'text-primary',
    path: '/projects',
  },
  {
    id: 'team',
    name: 'Équipe',
    description: 'Gérez votre équipe et les collaborateurs',
    icon: Users,
    color: 'from-primary/20 to-secondary/20',
    textColor: 'text-primary',
    path: '/team',
    soon: true,
  },
  {
    id: 'databases',
    name: 'Bases de données',
    description: 'Gérez vos bases de données',
    icon: Database,
    color: 'from-primary/20 to-secondary/20',
    textColor: 'text-primary',
    path: '/databases',
    soon: true,
  },
  {
    id: 'settings',
    name: 'Paramètres',
    description: 'Configurez vos préférences',
    icon: Settings,
    color: 'from-primary/20 to-secondary/20',
    textColor: 'text-primary',
    path: '/settings',
    soon: true,
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">
            Bienvenue, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-white/60">
            Gérez vos projets et ressources en un seul endroit
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {module.soon ? (
                <div className="relative group">
                  <div className="card h-full bg-gradient-to-br opacity-50 cursor-not-allowed">
                    <module.icon className="w-8 h-8 mb-4 text-white" />
                    <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
                    <p className="text-white/60">{module.description}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium">
                      Bientôt disponible
                    </span>
                  </div>
                </div>
              ) : (
                <Link to={module.path}>
                  <div className={`card h-full bg-gradient-to-br ${module.color} hover:scale-105 transition-transform`}>
                    <module.icon className="w-8 h-8 mb-4 text-white" />
                    <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
                    <p className="text-white/60">{module.description}</p>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}