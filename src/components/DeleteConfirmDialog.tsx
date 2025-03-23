import React from 'react';
import { motion } from 'framer-motion';

interface DeleteConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({ onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="card max-w-lg w-full"
      >
        <h3 className="text-xl font-bold mb-4">Supprimer le projet ?</h3>
        <p className="text-white/60 mb-6">
          Cette action est irréversible. Toutes les données liées au projet seront supprimées.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary bg-red-500/20 hover:bg-red-500/30 text-red-500"
          >
            Supprimer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}