import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProject() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([{
          ...data,
          status: 'à faire',
          type: 'webapp',
          user_id: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Projet créé avec succès');
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erreur lors de la création du projet');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour au tableau de bord
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold mb-8">Nouveau projet</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Nom du projet*
              </label>
              <input
                {...register('title')}
                type="text"
                id="title"
                className="input"
                placeholder="Mon super projet"
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Créer et configurer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}