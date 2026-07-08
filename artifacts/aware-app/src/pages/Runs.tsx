import { useEffect, useMemo, useState, useDeferredValue, useTransition } from 'react';
import { useSearch } from 'wouter';
import { Search, List } from 'lucide-react';
import { loadRuns } from '@/lib/data';
import type { Env, Run, RunStatus } from '@/lib/types';
import { RunRow } from '@/components/RunRow';
import { useSort, sortData, SortHeader } from '@/lib/sortableTable';

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
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const { sort, toggle } = useSort('started', 'desc');
  const [colLabelFilter, setColLabelFilter] = useState('');
  const [colEnvFilter, setColEnvFilter] = useState('');
  const [colSuiteFilter, setColSuiteFilter] = useState('');

  useEffect(() => { loadRuns().then(r => { setRuns(r); setLoading(false); }); }, []);
  useEffect(() => {
    const t = setTimeout(() => startTransition(() => setQuery(searchInput)), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(1), [envFilter, statusFilter, query]);

  const filtered = useMemo(() => {
    return runs
      .filter(r => envFilter === 'ALL' || r.env === envFilter)
      .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
      .filter(r => !query || [r.id, r.label, r.suiteId, r.build, r.rev].some(
        v => v?.toLowerCase().includes(query.toLowerCase())
      ))
      .filter(r => !colLabelFilter || r.label.toLowerCase().includes(colLabelFilter.toLowerCase()))
      .filter(r => !colEnvFilter || r.env.toLowerCase().includes(colEnvFilter.toLowerCase()))
      .filter(r => !colSuiteFilter || r.suiteId.toLowerCase().includes(colSuiteFilter.toLowerCase()));
  }, [runs, envFilter, statusFilter, query, colLabelFilter, colEnvFilter, colSuiteFilter]);

  const sorted = sortData(filtered, sort, {
    started: r => new Date(r.started).getTime(),
    label: r => r.label.toLowerCase(),
    env: r => r.env,
    suite: r => r.suiteId,
    passPct: r => r.passPct,
    failures: r => r.failures,
    duration: r => r.duration,
    status: r => r.status,
  });

  const deferredSorted = useDeferredValue(sorted);
  const pageCount = Math.ceil(deferredSorted.length / PAGE_SIZE);
  const paged = deferredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    QA: runs.filter(r => r.env === 'QA').length,
    UAT: runs.filter(r => r.env === 'UAT').length,
    PROD: runs.filter(r => r.env === 'PROD').length,
  }), [runs]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-gcp-blue/30 border-t-gcp-blue rounded-full animate-spin" />
        <span className="text-sm text-gcp-text-muted">Loading runs…</span>
      </div>
    </div>
  );

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gcp-blue/10 border border-gcp-blue/20">
          <List size={14} className="text-gcp-blue" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-gcp-text">Runs</h1>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-gcp-elevated text-gcp-text-secondary text-xs font-mono">
          {runs.length}
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Env toggles */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'QA', 'UAT', 'PROD'] as const).map(e => (
            <button key={e} onClick={() => startTransition(() => setEnvFilter(e as Env | 'ALL'))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                envFilter === e
                  ? 'bg-gcp-blue/20 text-gcp-blue-light border-gcp-blue/30'
                  : 'bg-gcp-elevated text-gcp-text-secondary border-gcp-border-soft hover:text-gcp-text hover:bg-gcp-elevated/50'
              }`}>{e === 'ALL' ? 'All Envs' : e}
            </button>
          ))}
        </div>

        {/* Status toggles */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'PASS', 'FAIL', 'PARTIAL'] as const).map(s => (
            <button key={s} onClick={() => startTransition(() => setStatusFilter(s as RunStatus | 'ALL'))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                statusFilter === s
                  ? 'bg-gcp-blue/20 text-gcp-blue-light border-gcp-blue/30'
                  : 'bg-gcp-elevated text-gcp-text-secondary border-gcp-border-soft hover:text-gcp-text hover:bg-gcp-elevated/50'
              }`}>{s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gcp-text-muted" />
          <input
            type="text"
            placeholder="Search run ID, suite, build…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-md pl-8 pr-3 py-1.5 placeholder:text-gcp-text-muted focus:outline-none focus:border-gcp-blue/50 focus:ring-1 focus:ring-gcp-blue/20 transition-colors"
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="text-xs text-gcp-text-muted flex items-center gap-4">
        <span className="text-gcp-text-secondary font-medium">{deferredSorted.length} of {runs.length} runs</span>
        <span>QA: {counts.QA}</span>
        <span>UAT: {counts.UAT}</span>
        <span>PROD: {counts.PROD}</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gcp-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gcp-surface/80 border-b border-gcp-border">
              <SortHeader label="Run / Label" sortKey="label" currentSort={sort} onToggle={toggle} filterValue={colLabelFilter} onFilterChange={setColLabelFilter} />
              <SortHeader label="Env" sortKey="env" currentSort={sort} onToggle={toggle} filterValue={colEnvFilter} onFilterChange={setColEnvFilter} filterPlaceholder="Filter env…" />
              <SortHeader label="Suite" sortKey="suite" currentSort={sort} onToggle={toggle} filterValue={colSuiteFilter} onFilterChange={setColSuiteFilter} />
              <SortHeader label="Pass Rate" sortKey="passPct" currentSort={sort} onToggle={toggle} />
              <SortHeader label="Failures" sortKey="failures" currentSort={sort} onToggle={toggle} />
              <SortHeader label="Duration" sortKey="duration" currentSort={sort} onToggle={toggle} />
              <SortHeader label="When" sortKey="started" currentSort={sort} onToggle={toggle} />
              <SortHeader label="Status" sortKey="status" currentSort={sort} onToggle={toggle} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gcp-border/70">
            {paged.map(r => <RunRow key={r.id} run={r} />)}
          </tbody>
        </table>
        {deferredSorted.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-gcp-text-muted text-sm">No runs match the current filters</div>
            <button onClick={() => startTransition(() => { setEnvFilter('ALL'); setStatusFilter('ALL'); setSearchInput(''); setQuery(''); setColLabelFilter(''); setColEnvFilter(''); setColSuiteFilter(''); })}
              className="mt-3 text-xs text-gcp-blue hover:text-gcp-blue-light transition-colors">
              Clear filters
            </button>
          </div>
        )}
        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gcp-border bg-gcp-surface/50">
            <span className="text-xs text-gcp-text-muted">Page {page} of {pageCount} · {deferredSorted.length} items</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors">«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors">‹</button>
              {Array.from({length: Math.min(5, pageCount)}, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, pageCount - 4));
                const p = start + i;
                return <button key={p} onClick={() => setPage(p)} className={`px-2 py-1 text-xs rounded transition-colors ${p === page ? 'bg-gcp-blue/20 text-gcp-blue font-semibold' : 'text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-elevated'}`}>{p}</button>;
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page === pageCount} className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors">›</button>
              <button onClick={() => setPage(pageCount)} disabled={page === pageCount} className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
