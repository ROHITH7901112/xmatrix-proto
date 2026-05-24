'use client';

import { useXMatrixStore } from '@/lib/store';
import { useTheme } from '@/components/providers/ThemeProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Map,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  LayoutDashboard,
} from 'lucide-react';

const navItems = [
  { id: 'x-matrix', label: 'X-Matrix', icon: LayoutGrid, href: '/' },
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'manage', label: 'Manage Data', icon: Database, href: '/manage' },
  { id: 'bowling-chart', label: 'Bowling Chart', icon: BarChart3, href: '/bowling-chart' },
  { id: 'strategy-map', label: 'Strategy Map', icon: Map, href: '/strategy-map' },
  { id: 'reviews', label: 'Reviews / Catchball', icon: MessageSquare, href: '/reviews' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const { viewState, toggleSidebar } = useXMatrixStore();
  const { sidebarCollapsed: collapsed } = viewState;
  const { colors } = useTheme();
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn('relative flex flex-col h-screen border-r z-40', colors.sidebar)}
    >
      {/* Logo Section */}
      <div className={cn('flex items-center h-16 px-4 border-b', colors.border.light)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded">
            <img
              src="/logo.png"
              alt="HARTS Logo"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
              >
                <span className="text-sm font-semibold text-white tracking-wide">HARTS</span>
                <span className="text-[10px] text-slate-400 tracking-widest">X Matrix</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                    'hover:bg-slate-800/80 group',
                    isActive && 'bg-slate-800 text-white',
                    !isActive && 'text-slate-400'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          'text-sm font-medium whitespace-nowrap',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        )}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-medium">
            CB
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="text-sm font-medium text-white truncate">CB</span>
                <span className="text-xs text-slate-500 truncate">Strategy Officer</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
