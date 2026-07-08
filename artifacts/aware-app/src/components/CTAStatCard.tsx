import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { EASE_OUT, PRESS_SCALE } from '@/lib/motion';

export function CTAStatCard({ icon: Icon, label, value, trend, color }: {
  icon: LucideIcon; label: string; value: string | number; trend?: 'up' | 'down'; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-gcp-blue/10 border-gcp-blue/20 text-gcp-blue',
    green: 'bg-gcp-green/10 border-gcp-green/20 text-gcp-green',
    red: 'bg-gcp-red/10 border-gcp-red/20 text-gcp-red',
    yellow: 'bg-gcp-yellow/10 border-gcp-yellow/20 text-gcp-yellow',
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl border p-5 ${c} bg-gcp-surface/60 backdrop-blur-md`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={EASE_OUT}
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }}
      whileTap={PRESS_SCALE}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gcp-border-soft bg-gcp-bg/50">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold tabular-nums tracking-tight" style={{ textShadow: '0 0 20px currentColor' }}>{value}</div>
          <div className="mt-0.5 truncate text-xs opacity-70">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}
