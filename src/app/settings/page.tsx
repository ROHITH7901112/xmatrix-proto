'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Settings, Moon, Sun, Palette, Bell, Shield, Database, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JiraSettingsPanel } from '@/components/settings/JiraSettingsPanel';
import { useXMatrixStore } from '@/lib/store';

const MATRIX_BACKUP_KEY = 'xmatrix_temp_clear_backup';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const matrix = useXMatrixStore((state) => state.data);
  const refreshData = useXMatrixStore((state) => state.refreshData);
  const [hasBackup, setHasBackup] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    setHasBackup(Boolean(window.localStorage.getItem(MATRIX_BACKUP_KEY)));
  }, []);

  const saveBackup = (snapshot: typeof matrix) => {
    window.localStorage.setItem(MATRIX_BACKUP_KEY, JSON.stringify(snapshot));
    setHasBackup(true);
  };

  const clearMatrix = async () => {
    console.log('Clear button clicked. Matrix:', matrix);
    if (!matrix?.id) {
      console.error('No matrix ID found');
      window.alert('Matrix data not loaded. Please refresh the page.');
      return;
    }
    if (!window.confirm('Clear this matrix? This will remove all objectives, initiatives, KPIs, owners, and relationships.')) return;

    setIsWorking(true);
    try {
      saveBackup(matrix);
      console.log('Backup saved');

      const emptyDraft = {
        ...matrix,
        longTermObjectives: [],
        annualObjectives: [],
        initiatives: [],
        kpis: [],
        owners: [],
        relationships: [],
      };

      console.log('Sending clear request to:', `/api/xmatrix/${matrix.id}`);
      const response = await fetch(`/api/xmatrix/${matrix.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: emptyDraft, original: matrix }),
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to clear matrix');
      }

      const result = await response.json();
      console.log('Clear successful:', result);
      await refreshData();
      window.alert('Matrix cleared successfully!');
    } catch (error) {
      console.error('Error clearing matrix:', error);
      window.alert('Unable to clear the matrix. Please try again. Check console for details.');
    } finally {
      setIsWorking(false);
    }
  };

  const undoClear = async () => {
    if (!matrix?.id) return;

    const backupJson = window.localStorage.getItem(MATRIX_BACKUP_KEY);
    if (!backupJson) {
      window.alert('No saved matrix snapshot found to restore.');
      return;
    }

    setIsWorking(true);
    try {
      const backup = JSON.parse(backupJson);

      const response = await fetch(`/api/xmatrix/${matrix.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: backup, original: matrix }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore matrix');
      }

      window.localStorage.removeItem(MATRIX_BACKUP_KEY);
      setHasBackup(false);
      await refreshData();
    } catch (error) {
      console.error('Error restoring matrix:', error);
      window.alert('Unable to restore the matrix. Please try again.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Appearance */}
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
                <Palette className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Appearance</h3>
                <p className="text-xs text-slate-500">Customize the look and feel</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div>
                  <div className="text-sm font-medium text-white">Dark Mode</div>
                  <div className="text-xs text-slate-500">Use dark theme across the application</div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    isDarkMode ? 'bg-blue-500' : 'bg-slate-700'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    isDarkMode ? 'translate-x-7' : 'translate-x-1'
                  )} />
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
                <Bell className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Notifications</h3>
                <p className="text-xs text-slate-500">Configure alert preferences</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div>
                  <div className="text-sm font-medium text-white">Email Notifications</div>
                  <div className="text-xs text-slate-500">Receive updates via email</div>
                </div>
                <button className="w-12 h-6 rounded-full bg-blue-500 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white" />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-white">KPI Alerts</div>
                  <div className="text-xs text-slate-500">Get notified when KPIs change status</div>
                </div>
                <button className="w-12 h-6 rounded-full bg-blue-500 relative">
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white" />
                </button>
              </div>
            </div>
          </section>

          {/* Data & Security */}
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Data & Security</h3>
                <p className="text-xs text-slate-500">Manage your data and security settings</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-left hover:border-slate-600 transition-colors">
                <Database className="w-5 h-5 text-slate-400 mb-2" />
                <div className="text-sm font-medium text-white">Export Data</div>
                <div className="text-xs text-slate-500">Download your strategy data</div>
              </button>
              <button className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-left hover:border-slate-600 transition-colors">
                <Shield className="w-5 h-5 text-slate-400 mb-2" />
                <div className="text-sm font-medium text-white">Security Log</div>
                <div className="text-xs text-slate-500">View access history</div>
              </button>
            </div>
          </section>

          {/* Matrix Tools */}
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
                <Database className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Matrix Tools</h3>
                <p className="text-xs text-slate-500">Temporary controls for testing UI changes</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={clearMatrix}
                disabled={isWorking || !matrix?.id}
                className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-left hover:bg-rose-500/15 hover:border-rose-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-rose-200">Clear Matrix</div>
                  <span className="text-[10px] uppercase tracking-widest text-rose-300/70">Temporary</span>
                </div>
                <div className="text-xs text-rose-100/75">
                  Remove all LTOs, AOs, initiatives, KPIs, owners, and relationships.
                </div>
              </button>

              <button
                onClick={undoClear}
                disabled={isWorking || !hasBackup}
                className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-left hover:bg-cyan-500/15 hover:border-cyan-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-cyan-200">Undo Clear</div>
                  <span className="text-[10px] uppercase tracking-widest text-cyan-300/70">Restore</span>
                </div>
                <div className="text-xs text-cyan-100/75">
                  Restore the last saved matrix snapshot.
                </div>
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {hasBackup ? 'A restore snapshot is available.' : 'No restore snapshot saved yet.'}
            </p>
          </section>

          {/* Jira Integration */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
                <LinkIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Integrations</h3>
                <p className="text-xs text-slate-500">Connect external tools and services</p>
              </div>
            </div>
            <JiraSettingsPanel />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
