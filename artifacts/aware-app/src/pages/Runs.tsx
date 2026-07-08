import { useEffect, useMemo, useState, useDeferredValue, useTransition } from 'react';
import { useSearch } from 'wouter';
import { Search, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadRuns } from '@/lib/data';
import type { Env, Run, RunStatus } from '@/lib/types';
import { RunRow } from '@/components/RunRow';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Pagination } from '@/components/Pagination';
import { PageWrapper } from '@/components/PageWrapper';
import { useSort, sortData, SortHeader } from '@/lib/sortableTable';
import { fadeDown, fastStagger, fadeUp, scaleIn } from '@/lib/motion';

const PAGE_SIZE = 25;

export default function Runs() {
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

  if (loading) return <LoadingSpinner label="Loading runs…" />;

  return (
    <PageWrapper className="proof-page space-y-5 relative">
      {/* Decorative gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gcp-blue via-gcp-blue/40 via-gcp-blue/10 to-transparent rounded-t-lg" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gcp-blue-bg border border-gcp-blue-border shadow-[0_0_14px_rgba(66,133,244,0.18)]"
        >
          <List size={16} className="text-gcp-blue" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gcp-text">Runs</h1>
          <p className="text-xs text-gcp-text-muted mt-0.5">Test execution history across environments</p>
        </div>
        <motion.span
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="ml-auto px-2.5 py-1 rounded-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text-secondary text-xs font-mono tabular-nums"
        >
          {runs.length}
        </motion.span>
      </div>

      {/* Filter bar */}
      <motion.div
        variants={fadeDown}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-4 flex-wrap"
      >
        {/* Env toggles — glass container */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gcp-elevated/40 backdrop-blur-sm border border-gcp-border-soft/50">
          {(['ALL', 'QA', 'UAT', 'PROD'] as const).map(e => (
            <button key={e} onClick={() => startTransition(() => setEnvFilter(e as Env | 'ALL'))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 border ${
                envFilter === e
                  ? 'bg-gcp-blue/20 text-gcp-blue-light border-gcp-blue/40 shadow-[0_0_8px_rgba(66,133,244,0.22)]'
                  : 'bg-transparent text-gcp-text-secondary border-transparent hover:text-gcp-text hover:bg-gcp-elevated/60'
              }`}>{e === 'ALL' ? 'All Envs' : e}
            </button>
          ))}
        </div>

        {/* Status toggles — glass container */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gcp-elevated/40 backdrop-blur-sm border border-gcp-border-soft/50">
          {(['ALL', 'PASS', 'FAIL', 'PARTIAL'] as const).map(s => (
            <button key={s} onClick={() => startTransition(() => setStatusFilter(s as RunStatus | 'ALL'))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 border ${
                statusFilter === s
                  ? 'bg-gcp-blue/20 text-gcp-blue-light border-gcp-blue/40 shadow-[0_0_8px_rgba(66,133,244,0.22)]'
                  : 'bg-transparent text-gcp-text-secondary border-transparent hover:text-gcp-text hover:bg-gcp-elevated/60'
              }`}>{s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gcp-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search run ID, suite, build…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full bg-gcp-elevated/70 backdrop-blur-sm border border-gcp-border-soft text-gcp-text text-sm rounded-lg pl-9 pr-3 py-2 placeholder:text-gcp-text-muted/60 focus:outline-none focus:border-gcp-blue/50 focus:ring-2 focus:ring-gcp-blue/15 focus:shadow-[0_0_10px_rgba(66,133,244,0.1)] transition-all duration-200"
          />
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-xs flex items-center gap-5 px-3 py-2 rounded-lg bg-gcp-elevated/30 border border-gcp-border-soft/30"
      >
        <span className="text-gcp-text-secondary font-medium tabular-nums">{deferredSorted.length} of {runs.length} runs</span>
        <span className="text-gcp-text-muted/40">|</span>
        <span className="text-gcp-text-muted">QA: <span className="text-gcp-text-secondary font-mono tabular-nums">{counts.QA}</span></span>
        <span className="text-gcp-text-muted">UAT: <span className="text-gcp-text-secondary font-mono tabular-nums">{counts.UAT}</span></span>
        <span className="text-gcp-text-muted">PROD: <span className="text-gcp-text-secondary font-mono tabular-nums">{counts.PROD}</span></span>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-gcp-border overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gcp-blue-bg/80 via-gcp-surface to-gcp-surface border-b border-gcp-border">
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
          <motion.tbody
            variants={fastStagger}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gcp-border/70"
          >
            {paged.map(r => <RunRow key={r.id} run={r} />)}
          </motion.tbody>
        </table>
        {deferredSorted.length === 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="py-20 flex flex-col items-center justify-center gap-3"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gcp-blue-bg border border-gcp-blue-border">
              <List size={20} className="text-gcp-blue/60" />
            </div>
            <div className="text-gcp-text-muted text-sm font-medium">No runs match the current filters</div>
            <p className="text-gcp-text-muted/50 text-xs">Try adjusting your search or filter criteria</p>
            <button onClick={() => startTransition(() => { setEnvFilter('ALL'); setStatusFilter('ALL'); setSearchInput(''); setQuery(''); setColLabelFilter(''); setColEnvFilter(''); setColSuiteFilter(''); })}
              className="mt-1 px-4 py-1.5 text-xs font-semibold text-gcp-blue bg-gcp-blue-bg border border-gcp-blue-border rounded-lg hover:bg-gcp-blue/20 hover:shadow-[0_0_8px_rgba(66,133,244,0.15)] transition-all duration-200">
              Clear filters
            </button>
          </motion.div>
        )}
        <Pagination page={page} pageCount={pageCount} total={deferredSorted.length} onPageChange={setPage} />
      </motion.div>
    </PageWrapper>
  );
}
