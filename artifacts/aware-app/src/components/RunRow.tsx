import { Link } from 'wouter';
import { StatusBadge } from '@/components/StatusBadge';
import type { Run } from '@/lib/types';

const ENV_STYLE: Record<string, string> = {
  QA:   'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  UAT:  'bg-sky-500/15 text-sky-300 border border-sky-500/25',
  PROD: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function RunRow({ run }: { run: Run }) {
  return (
    <tr className="group hover:bg-zinc-800/40 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/runs/${run.id}`}>
          <a className="group-hover:text-sky-400 transition-colors">
            <div className="font-mono text-xs text-zinc-100">{run.id}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{run.label}</div>
          </a>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${ENV_STYLE[run.env] ?? ''}`}>
          {run.env}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{run.suiteId.replace('suite_', '')}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${run.passPct >= 95 ? 'text-emerald-400' : run.passPct >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>
            {run.passPct}%
          </span>
          <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${run.passPct >= 95 ? 'bg-emerald-500' : run.passPct >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${run.passPct}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`font-mono text-xs tabular-nums ${run.failures > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
          {run.failures > 0 ? run.failures : '—'}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{run.duration}</td>
      <td className="px-4 py-3 text-xs text-zinc-500">{relativeTime(run.started)}</td>
      <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
    </tr>
  );
}
