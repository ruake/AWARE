import type { RunStatus } from '@/lib/types';

const CONFIG: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  PASS:    { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  FAIL:    { dot: 'bg-rose-400',    text: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25' },
  PARTIAL: { dot: 'bg-amber-400',   text: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' },
  RUNNING: { dot: 'bg-sky-400',     text: 'text-sky-300',     bg: 'bg-sky-500/10',     border: 'border-sky-500/25' },
  PENDING: { dot: 'bg-zinc-400',    text: 'text-zinc-300',    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/25' },
  ERROR:   { dot: 'bg-rose-400',    text: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25' },
};

export function StatusBadge({ status, size = 'md' }: { status: RunStatus | string; size?: 'sm' | 'md' }) {
  const c = CONFIG[status] ?? CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono font-semibold ${c.bg} ${c.border} ${size === 'sm' ? 'text-[10px]' : 'text-xs'} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {status}
    </span>
  );
}
