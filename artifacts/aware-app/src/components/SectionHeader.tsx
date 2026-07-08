import React from 'react';
import { motion } from 'framer-motion';

export const SectionHeader = React.memo(function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <motion.div 
      className="flex items-center justify-between mb-4"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div>
        <h2 className="text-sm font-semibold text-gcp-text">{title}</h2>
        {subtitle && <p className="text-xs text-gcp-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
});
