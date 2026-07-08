import React from 'react';
import { motion } from 'framer-motion';
import type { RunStatus } from '@/lib/types';

const CONFIG: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  PASS:    { dot: 'bg-gcp-green', text: 'text-gcp-green-light', bg: 'bg-gcp-green/10', border: 'border-gcp-green/25' },
  FAIL:    { dot: 'bg-gcp-red',    text: 'text-gcp-red-light',    bg: 'bg-gcp-red/10',    border: 'border-gcp-red/25' },
  PARTIAL: { dot: 'bg-gcp-yellow',   text: 'text-gcp-yellow-light',   bg: 'bg-gcp-yellow/10',   border: 'border-gcp-yellow/25' },
  RUNNING: { dot: 'bg-gcp-blue',     text: 'text-gcp-blue-light',     bg: 'bg-gcp-blue/10',     border: 'border-gcp-blue/25' },
  PENDING: { dot: 'bg-gcp-text-secondary',    text: 'text-gcp-text-secondary',    bg: 'bg-gcp-text-muted/10',    border: 'border-gcp-border/25' },
  ERROR:   { dot: 'bg-gcp-red',    text: 'text-gcp-red-light',    bg: 'bg-gcp-red/10',    border: 'border-gcp-red/25' },
};

export const StatusBadge = React.memo(function StatusBadge({ status, size = 'md' }: { status: RunStatus | string; size?: 'sm' | 'md' }) {
  const c = CONFIG[status] ?? CONFIG.PENDING;
  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.85 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono font-semibold ${c.bg} ${c.border} ${size === 'sm' ? 'text-[10px]' : 'text-xs'} ${c.text}`}
    >
      <motion.span 
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`}
        animate={status === 'RUNNING' ? { opacity: [1, 0.35, 1] } : undefined}
        transition={status === 'RUNNING' ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : undefined}
      />
      {status}
    </motion.span>
  );
});
