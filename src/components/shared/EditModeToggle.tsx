'use client';

import { useState, useEffect } from 'react';
import { useXMatrixStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Pencil, Save, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcknowledgementModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

import { createPortal } from 'react-dom';

function AcknowledgementModal({ isOpen, onSave, onDiscard, onCancel, isSaving }: AcknowledgementModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617]/98 backdrop-blur-xl px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#111827] border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
              <h3 className="text-lg font-semibold text-white">Relationship Acknowledgement</h3>
              <button
                onClick={onCancel}
                className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
              <p className="text-slate-300 text-[16px] font-medium leading-relaxed">
                Do you want to save or discard this relationship change?
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-6 pt-2">
              <button
                onClick={onDiscard}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Discard
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all border border-blue-500/50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function EditModeToggle() {
  const { editModeState, enterEditMode, exitEditMode } = useXMatrixStore();
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = editModeState.mode === 'edit';
  const hasUnsavedChanges = editModeState.hasUnsavedChanges;

  // Sync modal state with changes
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setShowModal(false);
    }
  }, [hasUnsavedChanges]);

  const handleToggleMode = () => {
    if (isEditMode) {
      if (hasUnsavedChanges) {
        setShowModal(true);
      } else {
        exitEditMode(false);
      }
    } else {
      enterEditMode();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await exitEditMode(true);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    exitEditMode(false);
    setShowModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => isEditMode && handleToggleMode()}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              !isEditMode
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={() => !isEditMode && handleToggleMode()}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              isEditMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        {/* Action Buttons - Visible only when there are unsaved changes */}
        <AnimatePresence>
          {isEditMode && hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={handleDiscard}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md shadow-sm transition-all"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AcknowledgementModal
        isOpen={showModal}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onCancel={() => setShowModal(false)}
        isSaving={isSaving}
      />
    </>
  );
}
