'use client';

import { useState } from 'react';
import { useXMatrixStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Pencil, Save, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function UnsavedChangesDialog({ isOpen, onSave, onDiscard, onCancel, isSaving }: UnsavedChangesDialogProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Unsaved Changes</h3>
              <p className="text-sm text-slate-400">
                You have unsaved changes to the strategy matrix. What would you like to do?
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
            <button
              onClick={onDiscard}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Discard Changes
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="w-full px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              Continue Editing
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function EditModeToggle() {
  const { editModeState, enterEditMode, exitEditMode } = useXMatrixStore();
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = editModeState.mode === 'edit';
  const hasUnsavedChanges = editModeState.hasUnsavedChanges;

  const handleToggleMode = () => {
    if (isEditMode) {
      if (hasUnsavedChanges) {
        setShowDialog(true);
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
      setShowDialog(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    exitEditMode(false);
    setShowDialog(false);
  };

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      await exitEditMode(true);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
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

        {/* Save Button - Only visible in edit mode */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              {hasUnsavedChanges && (
                <span className="text-xs text-amber-400 whitespace-nowrap">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSaveAndExit}
                disabled={isSaving || !hasUnsavedChanges}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Changes
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Mode Indicator Banner */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/90 backdrop-blur-sm rounded-full text-xs text-white shadow-lg">
              <Pencil className="w-3 h-3" />
              <span className="font-medium">Editing Strategy</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onCancel={() => setShowDialog(false)}
        isSaving={isSaving}
      />
    </>
  );
}
