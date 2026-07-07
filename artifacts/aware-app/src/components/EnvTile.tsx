import { useMemo } from 'react';
import { Link } from 'wouter';
import type { Env, Run } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function EnvTile({ env, runs }: { env: Env; runs: Run[] }) {
  const stats = useMemo(() => {
    if (runs.length === 0) {
      return { latest: null, avgPassPct: 0 };
    }
    const sorted = [...runs].sort((a, b) => b.started.localeCompare(a.started));
    const latest = sorted[0];
    const avgPassPct = Math.round(runs.reduce((sum, r) => sum + r.passPct, 0) / runs.length);
    return { latest, avgPassPct };
  }, [runs]);

  const { latest, avgPassPct } = stats;

  if (!latest) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">{env}</div>
        <div className="text-zinc-500">No data</div>
      </div>
    );
  }

  const startedDate = new Date(latest.started).toLocaleDateString();

  return (
    <Link href={`/runs?env=${env}`}>
      <a className="block bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors cursor-pointer">
        <div className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">{env}</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-zinc-100">{avgPassPct}%</div>
            <StatusBadge status={latest.status} />
          </div>
          <div className="text-xs text-zinc-500">{runs.length} run{runs.length !== 1 ? 's' : ''}</div>
          <div className="text-xs text-zinc-400">Latest: {startedDate}</div>
        </div>
      </a>
    </Link>
  );
}
