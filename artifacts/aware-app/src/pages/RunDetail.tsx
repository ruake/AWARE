import React, { useEffect, useMemo, useState, useDeferredValue, useTransition } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, ArrowRight, Search, ExternalLink, Cookie, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collapseHeight, fastStagger, fadeUp, scaleIn, slideInRight } from '@/lib/motion';
import { envBadgeClass, passRateColor } from '@/lib/envStyles';
import { loadRuns, loadResults, loadTestCases, getTestCaseById } from '@/lib/data';
import { getGitHubUrl } from '@/lib/utils';
import type { Run, TestResult, TestCase } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { PageWrapper } from '@/components/PageWrapper';
import { useSort, sortData, SortHeader } from '@/lib/sortableTable';

const PAGE_SIZE = 50;

const CollapsibleSection = React.memo(function CollapsibleSection({
  icon: Icon,
  title,
  count,
  defaultOpen,
  children,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="group border border-gcp-border/60 rounded-lg bg-gcp-bg/30 backdrop-blur-sm transition-all duration-200 hover:border-gcp-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gcp-text-secondary hover:text-gcp-text transition-colors rounded-lg hover:bg-gcp-elevated/20"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-gcp-text-muted group-hover:text-gcp-blue transition-colors" />
          <span>{title}</span>
          {count !== undefined && (
            <span className="text-gcp-text-muted font-mono text-[10px]">({count})</span>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown size={14} className="text-gcp-text-muted group-hover:text-gcp-text transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            variants={collapseHeight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="px-4 pb-4 max-h-64 overflow-y-auto"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const EvidencePanel = React.memo(function EvidencePanel({ result }: { result: TestResult }) {
  const requestHeaders = result.evidence?.request?.headers || {};
  const responseHeaders = result.evidence?.response?.headers || {};

  const cookies = useMemo(() => {
    const raw = responseHeaders['set-cookie'] || responseHeaders['Set-Cookie'] || '';
    if (!raw) return [];
    return raw.split(/,(?=\s*\w+=)/).map(c => c.trim()).filter(Boolean);
  }, [responseHeaders]);

  const statusColor = result.evidence?.response?.status
    ? result.evidence.response.status >= 500
      ? 'bg-gcp-red/20 text-gcp-red-light border-gcp-red/30'
      : result.evidence.response.status >= 400
      ? 'bg-gcp-yellow/20 text-gcp-yellow-light border-gcp-yellow/30'
      : 'bg-gcp-green/20 text-gcp-green-light border-gcp-green/30'
    : 'bg-gcp-text-muted/20 text-gcp-text-secondary border-gcp-text-muted/30';

  const timings = result.evidence?.response?.timings || {};
  const maxTiming = timings ? Math.max(...Object.values(timings)) : 0;

  const timingColor = (label: string) => {
    if (label.toLowerCase().includes('dns')) return 'from-gcp-yellow/60 to-gcp-yellow/30';
    if (label.toLowerCase().includes('tcp') || label.toLowerCase().includes('connect')) return 'from-gcp-blue/60 to-gcp-blue/30';
    if (label.toLowerCase().includes('tls') || label.toLowerCase().includes('ssl')) return 'from-gcp-purple/60 to-gcp-blue/30';
    if (label.toLowerCase().includes('ttfb')) return 'from-gcp-green/60 to-gcp-green/30';
    if (label.toLowerCase().includes('download') || label.toLowerCase().includes('transfer')) return 'from-gcp-blue/60 to-gcp-cyan/30';
    return 'from-gcp-text-muted/60 to-gcp-text-muted/30';
  };

  return (
    <div className="space-y-4">
      {/* Assertions */}
      <div className="glass-panel rounded-lg p-4">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-secondary mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-gcp-blue to-gcp-blue/40" />
          Assertions
        </h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {result.evidence?.assertions && result.evidence.assertions.length > 0 ? (
            result.evidence.assertions.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className={`flex items-start gap-2.5 p-3 rounded-lg border-l-2 transition-all duration-200 ${
                  a.pass
                    ? 'bg-gcp-green/10 border-gcp-green/40 hover:bg-gcp-green/15'
                    : 'bg-gcp-red/10 border-gcp-red/40 hover:bg-gcp-red/15'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {a.pass ? (
                    <CheckCircle2 size={16} className="text-gcp-green" />
                  ) : (
                    <XCircle size={16} className="text-gcp-red" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${a.pass ? 'text-gcp-green-light' : 'text-gcp-red-light'}`}>
                    {a.label}
                  </div>
                  {!a.pass && (
                    <div className="mt-2 space-y-1">
                      {a.expected && (
                        <div className="text-xs text-gcp-text-secondary">
                          <span className="text-gcp-text-muted">Expected:</span> <span className="font-mono bg-gcp-elevated/50 px-1.5 py-0.5 rounded text-gcp-text">{a.expected}</span>
                        </div>
                      )}
                      {a.actual && (
                        <div className="text-xs text-gcp-text-secondary">
                          <span className="text-gcp-text-muted">Actual:</span> <span className="font-mono bg-gcp-elevated/50 px-1.5 py-0.5 rounded text-gcp-red-light">{a.actual}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-xs text-gcp-text-muted italic px-2">No assertions recorded</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Request section */}
        <div className="space-y-3">
          {result.evidence?.request && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-panel rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded bg-gradient-to-r from-gcp-blue/30 to-gcp-blue/10 text-gcp-blue-light text-xs font-mono font-semibold border border-gcp-blue/30 shadow-sm shadow-gcp-blue/10">
                  {result.evidence.request.method}
                </span>
                <span className="text-xs text-gcp-text-secondary font-mono truncate">{result.evidence.request.url}</span>
              </div>
              {Object.entries(requestHeaders).length > 0 && (
                <CollapsibleSection icon={FileText} title="Request Headers" count={Object.entries(requestHeaders).length}>
                  <div className="space-y-1">
                    {Object.entries(requestHeaders).map(([k, v]) => (
                      <div key={k} className="text-xs text-gcp-text-secondary font-mono break-all hover:bg-gcp-elevated/40 px-1.5 py-0.5 rounded transition-colors border-l-2 border-transparent hover:border-gcp-blue/30">
                        <span className="text-gcp-text-muted">{k}:</span> {v}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </motion.div>
          )}
        </div>

        {/* Response section */}
        <div className="space-y-3">
          {result.evidence?.response && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="glass-panel rounded-lg p-4"
            >
              <div className="mb-3">
                {result.evidence.response.status !== undefined && (
                  <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-semibold font-mono ${statusColor} shadow-sm`}>
                    {result.evidence.response.status}
                  </span>
                )}
              </div>

              {Object.entries(responseHeaders).length > 0 && (
                <div className="space-y-2">
                  <CollapsibleSection icon={FileText} title="Response Headers" count={Object.entries(responseHeaders).length}>
                    <div className="space-y-1">
                      {Object.entries(responseHeaders).map(([k, v]) => (
                        <div key={k} className="text-xs text-gcp-text-secondary font-mono break-all hover:bg-gcp-elevated/40 px-1.5 py-0.5 rounded transition-colors border-l-2 border-transparent hover:border-gcp-green/30">
                          <span className="text-gcp-text-muted">{k}:</span> {v}
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {cookies.length > 0 && (
                    <CollapsibleSection icon={Cookie} title="Cookies" count={cookies.length}>
                      <div className="space-y-2">
                        {cookies.map((c, i) => {
                          const parts = c.split(';').map(s => s.trim());
                          const nv = parts[0] || '';
                          const attrs = parts.slice(1);
                          return (
                            <div key={i} className="border border-gcp-border/50 rounded-lg bg-gcp-surface/40 p-2.5 hover:bg-gcp-surface/60 transition-colors">
                              <div className="text-xs font-mono text-gcp-text font-semibold break-all">{nv}</div>
                              {attrs.length > 0 && (
                                <div className="mt-1.5 space-y-0.5">
                                  {attrs.map((a, j) => (
                                    <div key={j} className="text-[10px] text-gcp-text-muted font-mono flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-gcp-text-muted/30" />
                                      {a.trim()}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              )}

              {timings && Object.entries(timings).length > 0 && (
                <div className="mt-3 border border-gcp-border/60 rounded-lg bg-gcp-bg/30 backdrop-blur-sm p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-3 flex items-center gap-2">
                    <Clock size={12} className="text-gcp-text-muted" />
                    Timings
                  </h4>
                  <div className="space-y-2.5">
                    {Object.entries(timings).map(([label, ms]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gcp-text-secondary">
                          <span className="font-medium">{label}</span>
                          <span className="font-mono tabular-nums text-gcp-text-muted">{ms}ms</span>
                        </div>
                        <div className="w-full h-1.5 bg-gcp-elevated rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${maxTiming > 0 ? (ms / maxTiming) * 100 : 0}%` }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                            className={`h-full rounded-full bg-gradient-to-r ${timingColor(label)}`}
                            style={{
                              boxShadow: `0 0 8px ${ms === maxTiming ? 'rgba(66,133,244,0.3)' : 'transparent'}`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const [runs, setRuns] = useState<Run[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { sort, toggle } = useSort('name', 'asc');
  const [colNameFilter, setColNameFilter] = useState('');
  const [colCatFilter, setColCatFilter] = useState('');

  useEffect(() => {
    Promise.all([loadRuns(), loadResults(runId!), loadTestCases()]).then(([r, res]) => {
      setRuns(r);
      setResults(res);
      setLoading(false);
    });
  }, [runId]);

  useEffect(() => setPage(1), [statusFilter, query]);

  const run = useMemo(() => runs.find(r => r.id === runId), [runs, runId]);

  const filtered = useMemo(() => {
    return results.filter(r => {
      const statusMatch = statusFilter === 'ALL' || r.status === statusFilter;
      const queryMatch = !debouncedQuery || r.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || r.category.toLowerCase().includes(debouncedQuery.toLowerCase());
      const nameMatch = !colNameFilter || r.name.toLowerCase().includes(colNameFilter.toLowerCase());
      const catMatch = !colCatFilter || r.category.toLowerCase().includes(colCatFilter.toLowerCase());
      return statusMatch && queryMatch && nameMatch && catMatch;
    });
  }, [results, statusFilter, debouncedQuery, colNameFilter, colCatFilter]);

  const sorted = sortData(filtered, sort, {
    name: r => r.name.toLowerCase(),
    category: r => r.category.toLowerCase(),
    status: r => r.status,
    duration: r => r.duration,
  });

  const deferredSorted = useDeferredValue(sorted);

  const pageCount = Math.ceil(deferredSorted.length / PAGE_SIZE);
  const paged = deferredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-7 h-7 border-2 border-gcp-blue/20 border-t-gcp-blue rounded-full animate-spin" />
          <span className="text-sm text-gcp-text-muted">Loading run details…</span>
        </motion.div>
      </div>
    );
  }

  if (!run) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-6 space-y-4"
      >
        <div className="text-gcp-text-secondary space-y-4">
          <div className="glass-panel rounded-lg p-8 text-center">
            <p className="text-gcp-text-muted mb-4">Run not found</p>
            <Link href="/runs" className="inline-flex items-center gap-1.5 text-sm text-gcp-blue hover:text-gcp-blue-light transition-colors">
              <motion.span
                animate={{ x: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                ←
              </motion.span>
              Back to Runs
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const pc = passRateColor(run.passPct);
  const passColor = pc.text;
  const barColor = pc.bar;
  const glowColor = pc.glow;

  return (
    <PageWrapper className="flex flex-col min-h-screen bg-gcp-bg text-gcp-text">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 py-3 border-b border-gcp-border bg-gcp-surface/30 backdrop-blur-sm"
      >
        <Link href="/runs" className="group text-xs text-gcp-text-secondary hover:text-gcp-text transition-colors flex items-center gap-1.5">
          <motion.span
            className="inline-flex"
            whileHover={{ x: -3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <ArrowRight size={12} className="rotate-180" />
          </motion.span>
          <span>Runs</span>
          <span className="text-gcp-text-muted">/</span>
          <span className="font-mono text-gcp-blue-light">{run.id}</span>
        </Link>
      </motion.div>

      {/* Run header stat chips */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-6 py-5 bg-gcp-surface border-b border-gcp-border flex items-center gap-4 flex-wrap glass-panel rounded-none"
      >
        <span className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold ${envBadgeClass(run.env)} shadow-sm`}>
          {run.env}
        </span>
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`text-3xl font-bold tabular-nums ${passColor}`}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em' }}
          >
            {run.passPct}%
          </motion.span>
          <div className="w-24 h-2.5 rounded-full bg-gcp-elevated overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${run.passPct}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`h-full rounded-full ${barColor} relative`}
              style={{ boxShadow: `0 0 12px ${glowColor}` }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent" />
            </motion.div>
          </div>
        </div>
        <div className="w-px h-8 bg-gcp-border/50" />
        {[
          { label: 'Suite', value: run.suiteId.replace('suite_', ''), mono: true },
          { label: 'Failures', value: String(run.failures), color: run.failures > 0 ? 'text-gcp-red' : 'text-gcp-text-secondary' },
          { label: 'Duration', value: run.duration },
          { label: 'Build', value: run.build, mono: true },
          { label: 'Rev', value: run.rev, mono: true },
          { label: 'Started', value: new Date(run.started).toLocaleString() },
        ].map((chip, idx) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + idx * 0.03, duration: 0.2 }}
            className="flex flex-col gap-0.5"
          >
            <span className="text-[10px] uppercase tracking-wider text-gcp-text-muted">{chip.label}</span>
            <span className={`text-sm ${chip.mono ? 'font-mono tabular-nums' : ''} ${(chip as any).color ?? 'text-gcp-text'}`}>
              {chip.value}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 px-6 py-6 space-y-4 overflow-auto"
      >
        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {(['ALL', 'PASS', 'FAIL'] as const).map(s => (
            <button
              key={s}
              onClick={() => startTransition(() => setStatusFilter(s))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 border ${
                statusFilter === s
                  ? 'bg-gcp-blue/20 text-gcp-blue-light border-gcp-blue/30 shadow-sm shadow-gcp-blue/10'
                  : 'bg-gcp-elevated/50 text-gcp-text-secondary border-gcp-border-soft hover:text-gcp-text hover:bg-gcp-elevated hover:border-gcp-border/60 glass-panel'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gcp-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search test name, category…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-gcp-elevated/50 border border-gcp-border-soft text-gcp-text text-sm rounded-md pl-8 pr-3 py-1.5 placeholder:text-gcp-text-muted/60 focus:outline-none focus:border-gcp-blue/50 focus:ring-2 focus:ring-gcp-blue/15 transition-all duration-200 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-xs text-gcp-text-muted flex items-center gap-2"
        >
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gcp-elevated/40 border border-gcp-border/30 text-gcp-text-secondary">
            Showing <span className="font-mono tabular-nums text-gcp-text font-semibold">{paged.length}</span> of{' '}
            <span className="font-mono tabular-nums text-gcp-text font-semibold">{deferredSorted.length}</span> tests
          </span>
          {statusFilter === 'ALL' && (
            <>
              <span className="text-gcp-border/50">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gcp-green" />
                <span className="text-gcp-green-light">{results.filter(r => r.status === 'PASS').length} passed</span>
              </span>
              <span className="text-gcp-border/50">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gcp-red" />
                <span className="text-gcp-red-light">{results.filter(r => r.status === 'FAIL').length} failed</span>
              </span>
            </>
          )}
        </motion.div>

        {/* Test results table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-gcp-border overflow-hidden glass-panel"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gcp-surface/90 via-gcp-surface/80 to-gcp-surface/90 border-b border-gcp-border">
                <SortHeader label="Name" sortKey="name" currentSort={sort} onToggle={toggle} filterValue={colNameFilter} onFilterChange={setColNameFilter} />
                <SortHeader label="Category" sortKey="category" currentSort={sort} onToggle={toggle} filterValue={colCatFilter} onFilterChange={setColCatFilter} />
                <SortHeader label="Status" sortKey="status" currentSort={sort} onToggle={toggle} />
                <SortHeader label="Duration" sortKey="duration" currentSort={sort} onToggle={toggle} />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted" />
              </tr>
            </thead>
            <motion.tbody
              className="divide-y divide-gcp-border/60"
              variants={page === 1 ? fastStagger : undefined}
              initial="hidden"
              animate="visible"
            >
              {paged.length > 0 ? (
                paged.map((result, idx) => (
                  <React.Fragment key={result.id}>
                    <motion.tr
                      variants={page === 1 ? fadeUp : undefined}
                      onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                      className={`cursor-pointer transition-all duration-150 relative group ${
                        result.status === 'FAIL' ? 'bg-gcp-red/[0.04]' : ''
                      } hover:bg-gcp-elevated/30`}
                    >
                      {/* Left border accent on hover */}
                      <td className="px-0 py-0 w-0">
                        <div className={`w-0.5 h-full transition-all duration-200 ${
                          expandedId === result.id
                            ? result.status === 'FAIL' ? 'bg-gcp-red' : 'bg-gcp-blue'
                            : 'bg-transparent group-hover:bg-gcp-blue/40'
                        }`} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gcp-text group-hover:text-gcp-text transition-colors">{result.name}</span>
                          {(() => {
                            const tc = getTestCaseById(result.testCaseId);
                            const url = tc ? getGitHubUrl(tc) : null;
                            return url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-gcp-text-muted hover:text-gcp-blue transition-colors flex-shrink-0"
                              >
                                <ExternalLink size={12} />
                              </a>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gcp-text-secondary">{result.category}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={result.status} />
                      </td>
                      <td className="px-4 py-3 text-xs font-mono tabular-nums text-gcp-text-secondary">{formatDuration(result.duration)}</td>
                      <td className="px-4 py-3 text-gcp-text-muted">
                        <motion.div
                          animate={{ rotate: expandedId === result.id ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <ChevronDown size={14} className="group-hover:text-gcp-text transition-colors" />
                        </motion.div>
                      </td>
                    </motion.tr>
                    {expandedId === result.id && (
                      <tr className="bg-gcp-surface/30 border-b border-gcp-border">
                        <td colSpan={6} className="px-6 py-4">
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          >
                            <EvidencePanel result={result} />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-gcp-elevated/50 flex items-center justify-center border border-gcp-border/50">
                        <Search size={20} className="text-gcp-text-muted" />
                      </div>
                      <div className="text-gcp-text-muted text-sm">No tests match the current filters</div>
                      <button
                        onClick={() => {
                          setStatusFilter('ALL');
                          setQuery('');
                        }}
                        className="px-3 py-1.5 text-xs rounded-md bg-gcp-blue/20 text-gcp-blue-light border border-gcp-blue/30 hover:bg-gcp-blue/30 transition-colors shadow-sm shadow-gcp-blue/10"
                      >
                        Clear filters
                      </button>
                    </motion.div>
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>

          <Pagination page={page} pageCount={pageCount} total={deferredSorted.length} onPageChange={setPage} />
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
