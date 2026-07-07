import type { RunStatus } from '@/lib/types';

const MAP: Record<string, string> = {
  PASS:    'bg-emerald-900/30 text-emerald-400 border border-emerald-800',
  FAIL:    'bg-red-900/30 text-red-400 border border-red-800',
  PARTIAL: 'bg-amber-900/30 text-amber-400 border border-amber-800',
  RUNNING: 'bg-blue-900/30 text-blue-400 border border-blue-800',
  PENDING: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  ERROR:   'bg-red-900/30 text-red-400 border border-red-800',
};

export function StatusBadge({ status }: { status: RunStatus | string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold ${MAP[status] ?? MAP.PENDING}`}>
      {status}
    </span>
  );
}
