import React from 'react';
import { motion } from 'framer-motion';

export const SectionHeader = React.memo(function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <motion.div 
      className="mb-5 flex items-center justify-between"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gcp-text">{title}</h2>
          <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-gcp-blue/40 to-transparent" />
        </div>
        {subtitle && <p className="mt-1 text-xs text-gcp-text-muted">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
});
