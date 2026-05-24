'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

export function Legend() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn(
        'w-full flex items-center justify-center gap-4 py-1.5 border-t shadow-xl z-50 relative',
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#020617] border-slate-800'
      )}
    >
      {/* Health Legend */}
      <div className="flex items-center gap-3">
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isLight ? 'text-slate-600' : 'text-slate-500')}>Status</span>
        <div className="flex items-center gap-2">
          <LegendItem color="rgb(34, 197, 94)" label="On Track" isLight={isLight} />
          <LegendItem color="rgb(250, 204, 21)" label="At Risk" isLight={isLight} />
          <LegendItem color="rgb(239, 68, 68)" label="Off Track" isLight={isLight} />
        </div>
      </div>

      <div className={cn('w-px h-4', isLight ? 'bg-slate-300' : 'bg-slate-800')} />

      {/* Relationship Legend */}
      <div className="flex items-center gap-3">
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isLight ? 'text-slate-600' : 'text-slate-500')}>Relationships</span>
        <div className="flex items-center gap-2">
          <RelationshipDot size={8} color="rgb(236, 72, 153)" label="Primary" isLight={isLight} />
          <RelationshipDot size={6} color="rgb(139, 92, 246)" label="Secondary" isLight={isLight} />
        </div>
      </div>


    </motion.div>
  );
}


function LegendItem({ color, label, isLight }: { color: string; label: string; isLight: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className={cn('text-[10px]', isLight ? 'text-slate-600' : 'text-slate-400')}>{label}</span>
    </div>
  );
}

function RelationshipDot({ size, color, label, isLight }: { size: number; color: string; label: string; isLight: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 0 ${size / 2}px ${color}40`,
        }}
      />
      <span className={cn('text-[10px]', isLight ? 'text-slate-600' : 'text-slate-400')}>{label}</span>
    </div>
  );
}
