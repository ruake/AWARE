import { useEffect, useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { loadRuns } from '@/lib/data';
import type { Env, Run } from '@/lib/types';
import { RunRow } from '@/components/RunRow';

const ENVS: Env[] = ['QA', 'UAT', 'PROD'];

export default function Runs() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialEnv = params.get('env') as Env | null;

  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState<Env | 'ALL'>(initialEnv ?? 'ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadRuns().then(r => { setRuns(r); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return runs
      .filter(r => envFilter === 'ALL' || r.env === envFilter)
      .filter(r => !query || [r.id, r.label, r.suiteId, r.build].some(
        v => v.toLowerCase().includes(query.toLowerCase())
      ))
      .sort((a, b) => b.started.localeCompare(a.started));
  }, [runs, envFilter, query]);

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-zinc-100 flex-1">Runs</h1>
        <select
          value={envFilter}
          onChange={e => setEnvFilter(e.target.value as Env | 'ALL')}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-3 py-1.5"
        >
          <option value="ALL">All Envs</option>
          {ENVS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search run ID, suite, build…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-3 py-1.5 w-64 placeholder:text-zinc-500"
        />
      </div>

      <p className="text-xs text-zinc-500">Showing {filtered.length} of {runs.length} runs</p>

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
            {filtered.map(r => <RunRow key={r.id} run={r} />)}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-zinc-500 text-sm">No runs match the current filters.</div>
        )}
      </div>
    </div>
  );
}
