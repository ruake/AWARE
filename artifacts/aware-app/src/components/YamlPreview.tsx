import React from "react";
import { motion } from "framer-motion";
import { FileCode } from "lucide-react";

export function YamlPreview({ content, title }: { content: string; title?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-xl border border-gcp-border/60 shadow-lg shadow-black/20"
    >
      {title && (
        <div className="flex items-center gap-2 border-b border-gcp-border/60 bg-gcp-surface px-4 py-2.5 text-sm font-semibold text-gcp-text-secondary">
          <FileCode size={14} className="text-gcp-text-muted" />
          {title}
        </div>
      )}
      <pre className="overflow-x-auto bg-gcp-bg/80 p-4 font-mono text-xs leading-relaxed text-gcp-text backdrop-blur-sm">
        {content}
      </pre>
    </motion.div>
  );
}
