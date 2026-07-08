import { motion } from 'framer-motion';

export function Pagination({ page, pageCount, total, onPageChange }: {
  page: number; pageCount: number; total: number; onPageChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-between px-4 py-3 border-t border-gcp-border bg-gcp-surface/40 backdrop-blur-sm"
    >
      <span className="text-xs text-gcp-text-muted tabular-nums">Page {page} of {pageCount} · {total} items</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={page === 1}
          className="px-2.5 py-1.5 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-gcp-elevated/60 transition-all duration-150">«</button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="px-2.5 py-1.5 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-gcp-elevated/60 transition-all duration-150">‹</button>
        {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, pageCount - 4));
          const p = start + i;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all duration-150 ${
                p === page
                  ? 'bg-gcp-blue/20 text-gcp-blue-light font-semibold border border-gcp-blue/30 shadow-sm shadow-gcp-blue/10'
                  : 'text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-elevated/60 border border-transparent'
              }`}>{p}</button>
          );
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}
          className="px-2.5 py-1.5 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-gcp-elevated/60 transition-all duration-150">›</button>
        <button onClick={() => onPageChange(pageCount)} disabled={page >= pageCount}
          className="px-2.5 py-1.5 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-gcp-elevated/60 transition-all duration-150">»</button>
      </div>
    </motion.div>
  );
}
