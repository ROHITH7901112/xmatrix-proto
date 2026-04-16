'use client';

import { ReactNode } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showRotation?: boolean;
  showZoom?: boolean;
}

export function DashboardLayout({
  children,
  title,
  showRotation = false,
  showZoom = false,
}: DashboardLayoutProps) {
  const { colors } = useTheme();
  
  return (
    <div className={cn('flex h-screen overflow-hidden', colors.bg.primary)}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={title} showRotation={showRotation} showZoom={showZoom} />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
