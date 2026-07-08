import React from 'react';
import { motion } from 'framer-motion';

export function YamlPreview({ content, title }: { content: string; title?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-gcp-border overflow-hidden"
    >
      {title && (
        <div className="px-4 py-2 bg-gcp-surface border-b border-gcp-border text-sm font-semibold text-gcp-text-secondary">
          {title}
        </div>
      )}
      <pre className="p-4 text-xs font-mono text-gcp-text bg-gcp-bg overflow-x-auto leading-relaxed">
        {content}
      </pre>
    </motion.div>
  );
}
