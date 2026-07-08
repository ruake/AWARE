import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/StatusBadge';
import { envBadgeClass } from '@/lib/envStyles';
import { relativeTime } from '@/lib/utils';
import type { Run } from '@/lib/types';

export const RunRow = React.memo(function RunRow({ run }: { run: Run }) {
  return (
    <tr className="group hover:bg-gcp-elevated/40 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/runs/${run.id}`} className="group-hover:text-gcp-blue transition-colors">
          <div className="font-mono text-xs text-gcp-text">{run.id}</div>
          <div className="text-xs text-gcp-text-muted mt-0.5">{run.label}</div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${envBadgeClass(run.env)}`}>
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
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${run.passPct}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              className={`h-full rounded-full transition-all ${run.passPct >= 95 ? 'bg-gcp-green' : run.passPct >= 80 ? 'bg-gcp-yellow' : 'bg-gcp-red'}`}
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
