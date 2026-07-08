import React, { useEffect, useMemo, useState, useDeferredValue, useTransition } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, ArrowRight, Search, ExternalLink, Cookie, FileText } from 'lucide-react';
import { loadRuns, loadResults, loadTestCases, getTestCaseById } from '@/lib/data';
import { getGitHubUrl } from '@/lib/utils';
import type { Run, TestResult, TestCase } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { useSort, sortData, SortHeader } from '@/lib/sortableTable';

const PAGE_SIZE = 50;

const ENV_STYLE: Record<string, string> = {
  QA:   'bg-gcp-yellow/15 text-gcp-yellow-light border border-gcp-yellow/25',
  UAT:  'bg-gcp-blue/15 text-gcp-blue-light border border-gcp-blue/25',
  PROD: 'bg-gcp-green/15 text-gcp-green-light border border-gcp-green/25',
};

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
    <div className="border border-gcp-border rounded-lg bg-gcp-bg/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gcp-text-secondary hover:text-gcp-text transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-gcp-text-muted" />
          <span>{title}</span>
          {count !== undefined && (
            <span className="text-gcp-text-muted font-mono text-[10px]">({count})</span>
          )}
        </div>
        {open ? <ChevronDown size={14} className="text-gcp-text-muted" /> : <ChevronRight size={14} className="text-gcp-text-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4 max-h-64 overflow-y-auto">
          {children}
        </div>
      )}
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

  return (
    <div className="space-y-4">
      {/* Assertions */}
      <div className="border border-gcp-border rounded-lg bg-gcp-bg/50 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-secondary mb-4">Assertions</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {result.evidence?.assertions && result.evidence.assertions.length > 0 ? (
            result.evidence.assertions.map((a, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-2 rounded border ${a.pass ? 'bg-gcp-green/10 border-gcp-green/20' : 'bg-gcp-red/10 border-gcp-red/20'}`}>
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
                          <span className="text-gcp-text-muted">Expected:</span> <span className="font-mono">{a.expected}</span>
                        </div>
                      )}
                      {a.actual && (
                        <div className="text-xs text-gcp-text-secondary">
                          <span className="text-gcp-text-muted">Actual:</span> <span className="font-mono">{a.actual}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gcp-text-muted">No assertions</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Request section */}
        <div className="space-y-3">
          {result.evidence?.request && (
            <div className="border border-gcp-border rounded-lg bg-gcp-bg/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-1.5 py-0.5 rounded bg-gcp-blue/20 text-gcp-blue-light text-xs font-mono font-semibold border border-gcp-blue/30">
                  {result.evidence.request.method}
                </span>
                <span className="text-xs text-gcp-text-secondary font-mono truncate">{result.evidence.request.url}</span>
              </div>
              {Object.entries(requestHeaders).length > 0 && (
                <CollapsibleSection icon={FileText} title="Request Headers" count={Object.entries(requestHeaders).length}>
                  <div className="space-y-1">
                    {Object.entries(requestHeaders).map(([k, v]) => (
                      <div key={k} className="text-xs text-gcp-text-secondary font-mono break-all hover:bg-gcp-elevated/30 px-1 py-0.5 rounded">
                        <span className="text-gcp-text-muted">{k}:</span> {v}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          )}
        </div>

        {/* Response section */}
        <div className="space-y-3">
          {result.evidence?.response && (
            <div className="border border-gcp-border rounded-lg bg-gcp-bg/50 p-4">
              <div className="mb-3">
                {result.evidence.response.status !== undefined && (
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs font-semibold font-mono ${statusColor}`}>
                    {result.evidence.response.status}
                  </span>
                )}
              </div>

              {Object.entries(responseHeaders).length > 0 && (
                <div className="space-y-2">
                  <CollapsibleSection icon={FileText} title="Response Headers" count={Object.entries(responseHeaders).length}>
                    <div className="space-y-1">
                      {Object.entries(responseHeaders).map(([k, v]) => (
                        <div key={k} className="text-xs text-gcp-text-secondary font-mono break-all hover:bg-gcp-elevated/30 px-1 py-0.5 rounded">
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
                            <div key={i} className="border border-gcp-border/50 rounded bg-gcp-surface/30 p-2">
                              <div className="text-xs font-mono text-gcp-text font-semibold break-all">{nv}</div>
                              {attrs.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {attrs.map((a, j) => (
                                    <div key={j} className="text-[10px] text-gcp-text-muted font-mono">{a.trim()}</div>
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
                <div className="mt-3 border border-gcp-border rounded-lg bg-gcp-bg/50 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-3">Timings</h4>
                  <div className="space-y-2">
                    {Object.entries(timings).map(([label, ms]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gcp-text-secondary">
                          <span>{label}</span>
                          <span className="font-mono">{ms}ms</span>
                        </div>
                        <div className="w-full h-1.5 bg-gcp-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gcp-blue/60 rounded-full"
                            style={{ width: `${maxTiming > 0 ? (ms / maxTiming) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-gcp-blue/30 border-t-gcp-blue rounded-full animate-spin" />
          <span className="text-sm text-gcp-text-muted">Loading run details…</span>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="px-6 py-6 space-y-4">
        <div className="text-gcp-text-secondary space-y-4">
          <p>Run not found</p>
          <Link href="/runs">
            <a className="text-gcp-blue hover:text-gcp-blue-light transition-colors">← Back to Runs</a>
          </Link>
        </div>
      </div>
    );
  }

  const passColor = run.passPct >= 95 ? 'text-gcp-green' : run.passPct >= 80 ? 'text-gcp-yellow' : 'text-gcp-red';
  const barColor = run.passPct >= 95 ? 'bg-gcp-green' : run.passPct >= 80 ? 'bg-gcp-yellow' : 'bg-gcp-red';

  return (
    <div className="flex flex-col min-h-screen bg-gcp-bg text-gcp-text">
      {/* Back link */}
      <div className="px-6 py-4 border-b border-gcp-border">
        <Link href="/runs">
          <a className="text-xs text-gcp-text-secondary hover:text-gcp-text transition-colors flex items-center gap-1.5">
            <span>←</span>
            <span>Runs</span>
            <span className="text-gcp-text-muted">›</span>
            <span className="font-mono">{run.id}</span>
          </a>
        </Link>
      </div>

      {/* Run header stat chips */}
      <div className="px-6 py-5 bg-gcp-surface border-b border-gcp-border flex items-center gap-4 flex-wrap">
        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${ENV_STYLE[run.env]}`}>
          {run.env}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold tabular-nums ${passColor}`}>{run.passPct}%</span>
          <div className="w-24 h-2 rounded-full bg-gcp-elevated overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${run.passPct}%` }} />
          </div>
        </div>
        {[
          { label: 'Suite', value: run.suiteId.replace('suite_', ''), mono: true },
          { label: 'Failures', value: String(run.failures), color: run.failures > 0 ? 'text-gcp-red' : 'text-gcp-text-secondary' },
          { label: 'Duration', value: run.duration },
          { label: 'Build', value: run.build, mono: true },
          { label: 'Rev', value: run.rev, mono: true },
          { label: 'Started', value: new Date(run.started).toLocaleString() },
        ].map(chip => (
          <div key={chip.label} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-gcp-text-muted">{chip.label}</span>
            <span className={`text-sm ${chip.mono ? 'font-mono' : ''} ${(chip as any).color ?? 'text-gcp-text'}`}>
              {chip.value}
            </span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 py-6 space-y-4 overflow-auto">
        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {(['ALL', 'PASS', 'FAIL'] as const).map(s => (
            <button
              key={s}
              onClick={() => startTransition(() => setStatusFilter(s))}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                statusFilter === s
                  ? 'bg-gcp-blue/20 text-gcp-blue-light border-gcp-blue/30'
                  : 'bg-gcp-elevated text-gcp-text-secondary border-gcp-border-soft hover:text-gcp-text hover:bg-gcp-elevated/50'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gcp-text-muted" />
            <input
              type="text"
              placeholder="Search test name, category…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-md pl-8 pr-3 py-1.5 placeholder:text-gcp-text-muted focus:outline-none focus:border-gcp-blue/50 focus:ring-1 focus:ring-gcp-blue/20 transition-colors"
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className="text-xs text-gcp-text-muted">
          Showing <span className="text-gcp-text-secondary font-medium">{paged.length}</span> of{' '}
          <span className="text-gcp-text-secondary font-medium">{deferredSorted.length}</span> tests
          {statusFilter === 'ALL' && ' · ' + results.filter(r => r.status === 'PASS').length + ' passed'}
          {statusFilter === 'ALL' && ' · ' + results.filter(r => r.status === 'FAIL').length + ' failed'}
        </div>

        {/* Test results table */}
        <div className="rounded-lg border border-gcp-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gcp-surface/80 border-b border-gcp-border">
              <tr>
                <SortHeader label="Name" sortKey="name" currentSort={sort} onToggle={toggle} filterValue={colNameFilter} onFilterChange={setColNameFilter} />
                <SortHeader label="Category" sortKey="category" currentSort={sort} onToggle={toggle} filterValue={colCatFilter} onFilterChange={setColCatFilter} />
                <SortHeader label="Status" sortKey="status" currentSort={sort} onToggle={toggle} />
                <SortHeader label="Duration" sortKey="duration" currentSort={sort} onToggle={toggle} />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gcp-border/70">
              {paged.length > 0 ? (
                paged.map(result => (
                  <React.Fragment key={result.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                      className={`cursor-pointer transition-colors ${result.status === 'FAIL' ? 'bg-gcp-red/10' : ''} hover:bg-gcp-elevated/40`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gcp-text">{result.name}</span>
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
                      <td className="px-4 py-3 text-xs font-mono text-gcp-text-secondary">{formatDuration(result.duration)}</td>
                      <td className="px-4 py-3 text-gcp-text-muted">
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${expandedId === result.id ? 'rotate-180' : ''}`}
                        />
                      </td>
                    </tr>
                    {expandedId === result.id && (
                      <tr className="bg-gcp-surface/50 border-b border-gcp-border">
                        <td colSpan={5} className="px-6 py-4">
                          <EvidencePanel result={result} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="text-gcp-text-muted text-sm">No tests match the current filters</div>
                    <button
                      onClick={() => {
                        setStatusFilter('ALL');
                        setQuery('');
                      }}
                      className="mt-3 text-xs text-gcp-blue hover:text-gcp-blue-light transition-colors"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gcp-border bg-gcp-surface/50">
              <span className="text-xs text-gcp-text-muted">
                Page {page} of {pageCount} · {deferredSorted.length} items
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors"
                >
                  «
                </button>
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
                  const p = start + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        p === page
                          ? 'bg-gcp-blue/20 text-gcp-blue font-semibold'
                          : 'text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-elevated'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === pageCount}
                  className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors"
                >
                  ›
                </button>
                <button
                  onClick={() => setPage(pageCount)}
                  disabled={page === pageCount}
                  className="px-2 py-1 text-xs text-gcp-text-secondary hover:text-gcp-text disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gcp-elevated transition-colors"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
