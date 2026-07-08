import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

export function Markdown({ content }: { content: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="prose prose-sm max-w-none rounded-lg border border-gcp-border/30 bg-gcp-surface/30 p-4 prose-invert prose-headings:text-gcp-text prose-a:text-gcp-blue prose-strong:text-gcp-text prose-code:rounded prose-code:bg-gcp-elevated prose-code:px-1 prose-code:py-0.5 prose-code:text-gcp-blue-light prose-pre:rounded-lg prose-pre:border prose-pre:border-gcp-border prose-pre:bg-gcp-bg prose-blockquote:border-gcp-blue/40 prose-blockquote:text-gcp-text-secondary prose-li:text-gcp-text-secondary"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </motion.div>
  );
}
