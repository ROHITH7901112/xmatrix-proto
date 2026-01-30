'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useXMatrixStore } from '@/lib/store';
import { Settings, Moon, Sun, Palette, Bell, Shield, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { viewState, toggleDarkMode } = useXMatrixStore();

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
                  onClick={toggleDarkMode}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    viewState.isDarkMode ? 'bg-blue-500' : 'bg-slate-700'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    viewState.isDarkMode ? 'translate-x-7' : 'translate-x-1'
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div>
                  <div className="text-sm font-medium text-white">Accent Color</div>
                  <div className="text-xs text-slate-500">Choose your preferred accent color</div>
                </div>
                <div className="flex items-center gap-2">
                  {['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'].map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/50 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-white">Compact Mode</div>
                  <div className="text-xs text-slate-500">Display more content with reduced spacing</div>
                </div>
                <button className="w-12 h-6 rounded-full bg-slate-700 relative">
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white" />
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
        </div>
      </div>
    </DashboardLayout>
  );
}
