'use client';

import { motion } from 'framer-motion';

export function Legend() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 p-3 bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-xl"
      style={{ top: '920px' }}
    >
      {/* Health Legend - Updated terminology */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
        <div className="flex items-center gap-3">
          <LegendItem color="rgb(34, 197, 94)" label="Completed" />
          <LegendItem color="rgb(250, 204, 21)" label="In Progress" />
          <LegendItem color="rgb(239, 68, 68)" label="Delayed" />
        </div>
      </div>

      <div className="w-px h-6 bg-slate-700" />

      {/* Relationship Legend - Simplified to Primary/Secondary */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Relationships</span>
        <div className="flex items-center gap-3">
          <RelationshipDot size={10} color="rgb(236, 72, 153)" label="Primary" />
          <RelationshipDot size={7} color="rgb(139, 92, 246)" label="Secondary" />
        </div>
      </div>

      <div className="w-px h-6 bg-slate-700" />

      {/* Owner Responsibility Legend */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">RACI</span>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded">A</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded">R</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/20 text-yellow-400 rounded">C</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-500/20 text-slate-400 rounded">I</span>
        </div>
      </div>
    </motion.div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

function RelationshipDot({ size, color, label }: { size: number; color: string; label: string }) {
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
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
