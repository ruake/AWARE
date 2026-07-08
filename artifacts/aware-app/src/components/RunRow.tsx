import React from 'react';
import { Link } from 'wouter';
import { StatusBadge } from '@/components/StatusBadge';
import type { Run } from '@/lib/types';

const ENV_STYLE: Record<string, string> = {
  QA:   'bg-gcp-yellow/15 text-gcp-yellow-light border border-gcp-yellow/25',
  UAT:  'bg-gcp-blue/15 text-gcp-blue-light border border-gcp-blue/25',
  PROD: 'bg-gcp-green/15 text-gcp-green-light border border-gcp-green/25',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export const RunRow = React.memo(function RunRow({ run }: { run: Run }) {
  return (
    <tr className="group hover:bg-gcp-elevated/40 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/runs/${run.id}`}>
          <a className="group-hover:text-gcp-blue transition-colors">
            <div className="font-mono text-xs text-gcp-text">{run.id}</div>
            <div className="text-xs text-gcp-text-muted mt-0.5">{run.label}</div>
          </a>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${ENV_STYLE[run.env] ?? ''}`}>
          {run.env}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gcp-text-secondary">{run.suiteId.replace('suite_', '')}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${run.passPct >= 95 ? 'text-gcp-green' : run.passPct >= 80 ? 'text-gcp-yellow' : 'text-gcp-red'}`}>
            {run.passPct}%
          </span>
          <div className="w-16 h-1.5 rounded-full bg-gcp-elevated overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${run.passPct >= 95 ? 'bg-gcp-green' : run.passPct >= 80 ? 'bg-gcp-yellow' : 'bg-gcp-red'}`}
              style={{ width: `${run.passPct}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`font-mono text-xs tabular-nums ${run.failures > 0 ? 'text-gcp-red' : 'text-gcp-text-muted'}`}>
          {run.failures > 0 ? run.failures : '—'}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gcp-text-secondary">{run.duration}</td>
      <td className="px-4 py-3 text-xs text-gcp-text-muted">{relativeTime(run.started)}</td>
      <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
    </tr>
  );
});
