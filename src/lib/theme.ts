/**
 * Theme configuration and utilities
 */

export type Theme = 'light' | 'dark';

export const themes = {
  light: {
    // Backgrounds
    bg: {
      primary: 'bg-blue-50',// want a dark blue for primary bg in light mode what to do ? you 
      secondary: 'bg-white',
      tertiary: 'bg-slate-100',
      overlay: 'bg-black/10',
    },
    // Text
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-600',
      tertiary: 'text-slate-500',
      inverse: 'text-white',
    },
    // Borders
    border: {
      light: 'border-slate-200',
      normal: 'border-slate-300',
      dark: 'border-slate-400',
    },
    // Specific components
    input: 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500',
    card: 'bg-white border-slate-200',
    sidebar: 'bg-slate-100 border-slate-200',
    topbar: 'bg-white border-slate-200',
  },
  dark: {
    // Backgrounds
    bg: {
      primary: 'bg-slate-900',
      secondary: 'bg-slate-800',
      tertiary: 'bg-slate-700',
      overlay: 'bg-white/10',
    },
    // Text
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-500',
      inverse: 'text-slate-900',
    },
    // Borders
    border: {
      light: 'border-slate-700',
      normal: 'border-slate-600',
      dark: 'border-slate-500',
    },
    // Specific components
    input: 'bg-slate-900/70 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500',
    card: 'bg-slate-800 border-slate-700',
    sidebar: 'bg-slate-800 border-slate-700',
    topbar: 'bg-slate-800 border-slate-700',
  },
};

export const THEME_STORAGE_KEY = 'xmatrix_theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored as Theme) || 'dark';
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
