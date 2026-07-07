import { useEffect, useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { Search, List } from 'lucide-react';
import { loadRuns } from '@/lib/data';
import type { Env, Run, RunStatus } from '@/lib/types';
import { RunRow } from '@/components/RunRow';

const PAGE_SIZE = 25;

export default function Runs() {
  // read initial env from URL
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialEnv = (params.get('env') as Env | null) ?? 'ALL';

  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState<Env | 'ALL'>(initialEnv as Env | 'ALL');
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { loadRuns().then(r => { setRuns(r); setLoading(false); }); }, []);
  useEffect(() => setPage(1), [envFilter, statusFilter, query]);

  const filtered = useMemo(() => {
    return runs
      .filter(r => envFilter === 'ALL' || r.env === envFilter)
      .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
      .filter(r => !query || [r.id, r.label, r.suiteId, r.build, r.rev].some(
        v => v?.toLowerCase().includes(query.toLowerCase())
      ))
      .sort((a, b) => b.started.localeCompare(a.started));
  }, [runs, envFilter, statusFilter, query]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    QA: runs.filter(r => r.env === 'QA').length,
    UAT: runs.filter(r => r.env === 'UAT').length,
    PROD: runs.filter(r => r.env === 'PROD').length,
  }), [runs]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Loading runs…</span>
      </div>
    </div>
  );

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20">
          <List size={14} className="text-sky-400" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Runs</h1>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
          {runs.length}
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Env toggles */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'QA', 'UAT', 'PROD'] as const).map(e => (
            <button key={e} onClick={() => setEnvFilter(e as Env | 'ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                envFilter === e
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}>{e === 'ALL' ? 'All Envs' : e}
            </button>
          ))}
        </div>

        {/* Status toggles */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'PASS', 'FAIL', 'PARTIAL'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s as RunStatus | 'ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                statusFilter === s
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}>{s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search run ID, suite, build…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700/50 text-zinc-100 text-sm rounded-md pl-8 pr-3 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="text-xs text-zinc-500 flex items-center gap-4">
        <span className="text-zinc-400 font-medium">{filtered.length} of {runs.length} runs</span>
        <span>QA: {counts.QA}</span>
        <span>UAT: {counts.UAT}</span>
        <span>PROD: {counts.PROD}</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              {['Run / Label', 'Env', 'Suite', 'Pass Rate', 'Failures', 'Duration', 'When', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {paged.map(r => <RunRow key={r.id} run={r} />)}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-zinc-600 text-sm">No runs match the current filters</div>
            <button onClick={() => { setEnvFilter('ALL'); setStatusFilter('ALL'); setQuery(''); }}
              className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors">
              Clear filters
            </button>
          </div>
        )}
        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <span className="text-xs text-zinc-500">Page {page} of {pageCount} · {filtered.length} items</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors">«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors">‹</button>
              {Array.from({length: Math.min(5, pageCount)}, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, pageCount - 4));
                const p = start + i;
                return <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 text-xs rounded transition-colors ${p === page ? 'bg-sky-500/20 text-sky-400 font-semibold' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}>{p}</button>;
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page === pageCount} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors">›</button>
              <button onClick={() => setPage(pageCount)} disabled={page === pageCount} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
