'use client';

import { motion } from 'framer-motion';

export function Legend() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full flex items-center justify-center gap-4 py-1.5 bg-[#020617] border-t border-slate-800 shadow-xl z-50 relative"
    >
      {/* Health Legend */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</span>
        <div className="flex items-center gap-2">
          <LegendItem color="rgb(34, 197, 94)" label="Completed" />
          <LegendItem color="rgb(250, 204, 21)" label="In Progress" />
          <LegendItem color="rgb(239, 68, 68)" label="Delayed" />
        </div>
      </div>

      <div className="w-px h-4 bg-slate-800" />

      {/* Relationship Legend */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Relationships</span>
        <div className="flex items-center gap-2">
          <RelationshipDot size={8} color="rgb(236, 72, 153)" label="Primary" />
          <RelationshipDot size={6} color="rgb(139, 92, 246)" label="Secondary" />
        </div>
      </div>


    </motion.div>
  );
}


function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-slate-400">{label}</span>
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
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

function RaciItem({ letter, color }: { letter: string; color: 'red' | 'blue' | 'yellow' | 'slate' }) {
  const colorMap = {
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    slate: 'bg-slate-500/20 text-slate-400',
  } as const;

  return (
    <span className={`px-1 py-0 text-[9px] font-bold rounded ${colorMap[color]}`}>{letter}</span>
  );
}
