'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Copy, Link as LinkIcon, Save, Trash2 } from 'lucide-react';

type WebhookSettings = {
  instanceUrl: string;
  projectKey: string;
  xmatrixId: string;
  webhookSecret: string;
  enabled: boolean;
};

const WEBHOOK_SETTINGS_KEY = 'jira_webhook_settings_v1';

const defaultSettings: WebhookSettings = {
  instanceUrl: 'https://shibik2004.atlassian.net',
  projectKey: 'XMAT',
  xmatrixId: '',
  webhookSecret: '',
  enabled: true,
};

export function JiraSettingsPanel() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<WebhookSettings>(defaultSettings);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    const origin = window.location.origin;
    setBaseUrl(origin);

    try {
      const stored = localStorage.getItem(WEBHOOK_SETTINGS_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<WebhookSettings>;
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore malformed local config
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setMessage(null);
    try {
      if (!settings.instanceUrl.trim().includes('atlassian.net')) {
        setMessage({ type: 'error', text: 'Invalid Jira instance URL' });
        return;
      }

      if (!settings.projectKey.trim()) {
        setMessage({ type: 'error', text: 'Project key is required' });
        return;
      }

      if (!settings.xmatrixId.trim()) {
        setMessage({ type: 'error', text: 'X-Matrix ID is required for webhook mapping' });
        return;
      }

      if (!settings.webhookSecret.trim()) {
        setMessage({ type: 'error', text: 'Webhook secret is required' });
        return;
      }

      localStorage.setItem(WEBHOOK_SETTINGS_KEY, JSON.stringify(settings));
      setMessage({ type: 'success', text: 'Webhook settings saved' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      });
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear webhook configuration?')) {
      localStorage.removeItem(WEBHOOK_SETTINGS_KEY);
      setSettings(defaultSettings);
      setMessage({ type: 'success', text: 'Webhook settings cleared' });
    }
  };

  const webhookUrl = `${baseUrl}/api/webhooks/jira?projectKey=${encodeURIComponent(settings.projectKey.trim().toUpperCase())}&xmatrixId=${encodeURIComponent(settings.xmatrixId.trim())}&secret=${encodeURIComponent(settings.webhookSecret.trim())}`;

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setMessage({ type: 'success', text: 'Webhook URL copied' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to copy webhook URL' });
    }
  };

  return (
    <div className="space-y-6">
      <div className={cn('rounded-lg p-6 border', colors.card)}>
        <h2 className={cn('text-xl font-semibold mb-4', colors.text.primary)}>Jira Webhook Integration (Stories → Initiatives)</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Jira Instance URL
            </label>
            <input
              type="text"
              name="instanceUrl"
              value={settings.instanceUrl}
              onChange={handleInputChange}
              placeholder="https://your-domain.atlassian.net"
              className={cn('w-full px-4 py-2 rounded-lg focus:outline-none', colors.input)}
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Jira Project Key
            </label>
            <input
              type="text"
              name="projectKey"
              value={settings.projectKey}
              onChange={handleInputChange}
              placeholder="XMAT"
              className={cn('w-full px-4 py-2 rounded-lg focus:outline-none', colors.input)}
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Target X-Matrix ID
            </label>
            <input
              type="text"
              name="xmatrixId"
              value={settings.xmatrixId}
              onChange={handleInputChange}
              placeholder="Paste your xmatrix id"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Webhook Secret
            </label>
            <input
              type="text"
              name="webhookSecret"
              value={settings.webhookSecret}
              onChange={handleInputChange}
              placeholder="Set a random secret string"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="jiraEnabled"
              checked={settings.enabled}
              onChange={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="jiraEnabled" className="text-sm text-slate-300">
              Enable webhook processing
            </label>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-700 text-green-300'
                : 'bg-red-900/30 border border-red-700 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <Check size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            <Save size={16} />
            Save Webhook Settings
          </button>

          <button
            onClick={copyWebhookUrl}
            disabled={!settings.enabled}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            <Copy size={16} />
            Copy Webhook URL
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>

        <div className="mt-6 p-3 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="flex items-center gap-2 text-slate-200 mb-2">
            <LinkIcon size={16} />
            <span className="text-sm font-semibold">Webhook URL</span>
          </div>
          <div className="text-xs text-cyan-300 break-all">{webhookUrl}</div>
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300">
          <p className="font-semibold text-slate-200 mb-2">Jira webhook setup (real-time):</p>
          <ul className="space-y-1 text-xs">
            <li>1) In Jira, create a webhook with this URL</li>
            <li>2) Select events: Issue created + Issue updated</li>
            <li>3) Use JQL: project = {settings.projectKey || 'XMAT'} AND issuetype = Story</li>
            <li>4) Story create/update events will upsert initiatives in real time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
