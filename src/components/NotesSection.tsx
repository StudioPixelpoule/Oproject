import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Note } from '../types/database';

const noteSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis'),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NotesSectionProps {
  projectId: string;
}

export default function NotesSection({ projectId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
  });

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  async function fetchNotes() {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: NoteFormData) => {
    try {
      if (editingNoteId) {
        const { error } = await supabase
          .from('notes')
          .update({ content: data.content })
          .eq('id', editingNoteId);

        if (error) throw error;
        toast.success('Note mise à jour');
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([{
            project_id: projectId,
            content: data.content,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          }]);

        if (error) throw error;
        toast.success('Note ajoutée');
      }

      reset();
      setEditingNoteId(null);
      setShowNewNoteForm(false);
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Erreur lors de l\'enregistrement de la note');
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      toast.success('Note supprimée');
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Erreur lors de la suppression de la note');
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    reset({ content: note.content });
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setShowNewNoteForm(false);
    reset();
  };

  if (loading) {
    return <div className="animate-pulse">Chargement des notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes</h3>
        {!showNewNoteForm && (
          <button
            onClick={() => setShowNewNoteForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle note
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {(showNewNoteForm || editingNoteId) && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit(onSubmit)}
            className="card bg-white/10"
          >
            <textarea
              {...register('content')}
              className="input min-h-[100px] mb-4"
              placeholder="Contenu de la note..."
              autoFocus
            />
            {errors.content && (
              <p className="text-red-500 text-sm mb-4">{errors.content.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </motion.form>
        )}

        {notes.map((note) => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-white/10"
          >
            {editingNoteId === note.id ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <textarea
                  {...register('content')}
                  className="input min-h-[100px]"
                  defaultValue={note.content}
                  autoFocus
                />
                {errors.content && (
                  <p className="text-red-500 text-sm">{errors.content.message}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm text-white/60">
                    {new Date(note.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(note)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{note.content}</p>
              </>
            )}
          </motion.div>
        ))}

        {notes.length === 0 && !showNewNoteForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-white/60"
          >
            Aucune note pour le moment
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}