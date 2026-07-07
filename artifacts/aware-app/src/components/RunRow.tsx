import { Link } from 'wouter';
import type { Run } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function RunRow({ run }: { run: Run }) {
  const startedDate = new Date(run.started).toLocaleDateString();

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/runs/${run.id}`}>
          <a className="text-blue-400 hover:text-blue-300 font-mono text-sm">{run.id}</a>
        </Link>
      </td>
      <td className="px-4 py-3 text-sm">
        <span className="text-zinc-300">{run.env}</span>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-300">{run.suiteId}</td>
      <td className="px-4 py-3 text-sm font-semibold text-zinc-100">{run.passPct}%</td>
      <td className="px-4 py-3 text-sm text-zinc-300">{run.failures}</td>
      <td className="px-4 py-3 text-sm text-zinc-300">{run.duration}</td>
      <td className="px-4 py-3 text-sm text-zinc-400">{startedDate}</td>
      <td className="px-4 py-3">
        <StatusBadge status={run.status} />
      </td>
    </tr>
  );
}
