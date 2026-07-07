import { useEffect, useMemo, useState } from 'react';
import { loadRuns } from '@/lib/data';
import type { Run } from '@/lib/types';
import { EnvTile } from '@/components/EnvTile';
import { RunRow } from '@/components/RunRow';

export default function Dashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRuns().then(r => { setRuns(r); setLoading(false); });
  }, []);

  const byEnv = useMemo(() => ({
    QA:   runs.filter(r => r.env === 'QA'),
    UAT:  runs.filter(r => r.env === 'UAT'),
    PROD: runs.filter(r => r.env === 'PROD'),
  }), [runs]);

  const recent = useMemo(() =>
    [...runs].sort((a,b) => b.started.localeCompare(a.started)).slice(0, 10),
    [runs]
  );

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <EnvTile env="QA"   runs={byEnv.QA} />
        <EnvTile env="UAT"  runs={byEnv.UAT} />
        <EnvTile env="PROD" runs={byEnv.PROD} />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recent Runs</h2>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                {['Run', 'Env', 'Suite', 'Pass %', 'Failures', 'Duration', 'Started', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {recent.map(r => <RunRow key={r.id} run={r} />)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
