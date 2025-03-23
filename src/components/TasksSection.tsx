import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Circle, Clock, Plus, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Task, TaskStatus } from '../types/database';

const taskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  notes: z.string().optional(),
  status: z.enum(['à faire', 'en cours', 'fait'] as const),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TasksSectionProps {
  projectId: string;
}

const statusIcons = {
  'à faire': Circle,
  'en cours': Clock,
  'fait': CheckCircle2,
};

const statusColors = {
  'à faire': 'text-white/60',
  'en cours': 'text-primary',
  'fait': 'text-green-500',
};

export default function TasksSection({ projectId }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'à faire',
    },
  });

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (editingTaskId) {
        const { error } = await supabase
          .from('tasks')
          .update(data)
          .eq('id', editingTaskId);

        if (error) throw error;
        toast.success('Tâche mise à jour');
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([{
            project_id: projectId,
            ...data,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          }]);

        if (error) throw error;
        toast.success('Tâche ajoutée');
      }

      reset();
      setEditingTaskId(null);
      setShowNewTaskForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Erreur lors de l\'enregistrement de la tâche');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Tâche supprimée');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    reset({
      title: task.title,
      notes: task.notes || '',
      status: task.status,
    });
    setShowNewTaskForm(true);
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
        <h3 className="text-lg font-semibold">Tâches</h3>
        {!showNewTaskForm && (
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {showNewTaskForm && (
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
                  placeholder="Titre de la tâche"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  className="input min-h-[100px]"
                  placeholder="Notes ou détails supplémentaires..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Statut
                </label>
                <select {...register('status')} className="input">
                  <option value="à faire" className="bg-background">À faire</option>
                  <option value="en cours" className="bg-background">En cours</option>
                  <option value="fait" className="bg-background">Fait</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowNewTaskForm(false);
                  setEditingTaskId(null);
                  reset();
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingTaskId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </motion.form>
        )}

        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card bg-white/10"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => {
                    const statuses: TaskStatus[] = ['à faire', 'en cours', 'fait'];
                    const currentIndex = statuses.indexOf(task.status);
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    updateTaskStatus(task.id, nextStatus);
                  }}
                  className={`mt-1 ${statusColors[task.status]} hover:text-white transition-colors`}
                >
                  <StatusIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold mb-2">{task.title}</h4>
                  {task.notes && (
                    <p className="text-white/60 whitespace-pre-wrap mb-4">{task.notes}</p>
                  )}
                  <p className="text-sm text-white/40">
                    Créée le {new Date(task.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(task)}
                    className="btn-secondary"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn-secondary bg-red-500/20 hover:bg-red-500/30 text-red-500"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {tasks.length === 0 && !showNewTaskForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-white/60"
          >
            Aucune tâche pour le moment
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}