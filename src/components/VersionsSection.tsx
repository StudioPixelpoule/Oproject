import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Download, Trash2, Plus, Save, X, FileArchive, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const versionSchema = z.object({
  version: z.string().min(1, 'Le numéro de version est requis'),
  description: z.string().optional(),
  file: z.any().refine((file) => {
    if (!(file instanceof FileList)) return false;
    if (file.length === 0) return false;
    const firstFile = file[0];
    return firstFile.size <= 100 * 1024 * 1024; // 100MB max
  }, 'Le fichier ne doit pas dépasser 100MB'),
});

type VersionFormData = z.infer<typeof versionSchema>;

interface Version {
  id: string;
  version: string;
  description: string | null;
  file_path: string;
  file_size: number;
  created_at: string;
}

interface VersionsSectionProps {
  projectId: string;
}

export default function VersionsSection({ projectId }: VersionsSectionProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewVersionForm, setShowNewVersionForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VersionFormData>({
    resolver: zodResolver(versionSchema),
  });

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  async function fetchVersions() {
    try {
      const { data, error } = await supabase
        .from('versions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Erreur lors du chargement des versions');
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: VersionFormData) => {
    try {
      setUploading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const fileList = data.file as FileList;
      if (!fileList || fileList.length === 0) {
        throw new Error('Aucun fichier sélectionné');
      }

      const file = fileList[0];
      const filePath = `${user.id}/${projectId}/${data.version}/${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('project_versions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create version record
      const { error: insertError } = await supabase
        .from('versions')
        .insert([{
          project_id: projectId,
          version: data.version,
          description: data.description,
          file_path: filePath,
          file_size: file.size,
          user_id: user.id,
        }]);

      if (insertError) throw insertError;

      toast.success('Version ajoutée');
      reset();
      setShowNewVersionForm(false);
      fetchVersions();
    } catch (error) {
      console.error('Error saving version:', error);
      toast.error('Erreur lors de l\'enregistrement de la version');
    } finally {
      setUploading(false);
    }
  };

  const downloadVersion = async (version: Version) => {
    try {
      const { data, error } = await supabase.storage
        .from('project_versions')
        .download(version.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = version.file_path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading version:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const deleteVersion = async (version: Version) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('project_versions')
        .remove([version.file_path]);

      if (storageError) throw storageError;

      // Delete version record
      const { error: dbError } = await supabase
        .from('versions')
        .delete()
        .eq('id', version.id);

      if (dbError) throw dbError;

      toast.success('Version supprimée');
      fetchVersions();
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Chargement des versions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Versions</h3>
        {!showNewVersionForm && (
          <button
            onClick={() => setShowNewVersionForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle version
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {showNewVersionForm && (
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
                  Numéro de version*
                </label>
                <input
                  {...register('version')}
                  type="text"
                  className="input"
                  placeholder="1.0.0"
                />
                {errors.version && (
                  <p className="text-red-500 text-sm mt-1">{errors.version.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  className="input min-h-[100px]"
                  placeholder="Description des changements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Fichier ZIP*
                </label>
                <input
                  {...register('file')}
                  type="file"
                  accept=".zip"
                  className="input"
                />
                {errors.file && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.file.message || 'Le fichier est requis'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowNewVersionForm(false);
                  reset();
                }}
                className="btn-secondary flex items-center gap-2"
                disabled={uploading}
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Uploader
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {versions.map((version) => (
          <motion.div
            key={version.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card bg-white/10"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <FileArchive className="w-5 h-5 text-primary" />
                  <h4 className="text-lg font-semibold">v{version.version}</h4>
                  <span className="text-sm text-white/60">
                    {(version.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  {new Date(version.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {version.description && (
                  <p className="text-white/80 mt-2">{version.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadVersion(version)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
                <button
                  onClick={() => deleteVersion(version)}
                  className="p-2 rounded hover:bg-white/10 transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {versions.length === 0 && !showNewVersionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-white/60"
          >
            Aucune version pour le moment
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}