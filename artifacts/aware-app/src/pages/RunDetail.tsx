import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'wouter';
import { ChevronDown, CheckCircle2, XCircle, Clock, ArrowRight, Search } from 'lucide-react';
import { loadRuns, loadResults } from '@/lib/data';
import type { Run, TestResult } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

const PAGE_SIZE = 50;

const ENV_STYLE: Record<string, string> = {
  QA:   'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  UAT:  'bg-sky-500/15 text-sky-300 border border-sky-500/25',
  PROD: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
};

function EvidencePanel({ result }: { result: TestResult }) {
  const [showMoreHeaders, setShowMoreHeaders] = useState(false);

  const requestHeaders = result.evidence?.request?.headers || {};
  const responseHeaders = result.evidence?.response?.headers || {};
  const displayedReqHeaders = showMoreHeaders ? requestHeaders : Object.entries(requestHeaders).slice(0, 3);
  const displayedResHeaders = showMoreHeaders ? responseHeaders : Object.entries(responseHeaders).slice(0, 3);

  const statusColor = result.evidence?.response?.status
    ? result.evidence.response.status >= 500
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : result.evidence.response.status >= 400
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';

  const timings = result.evidence?.response?.timings || {};
  const maxTiming = timings ? Math.max(...Object.values(timings)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Assertions */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Assertions</h4>
          <div className="space-y-3">
            {result.evidence?.assertions && result.evidence.assertions.length > 0 ? (
              result.evidence.assertions.map((a, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2 rounded border ${a.pass ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {a.pass ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${a.pass ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {a.label}
                    </div>
                    {!a.pass && (
                      <div className="mt-2 space-y-1">
                        {a.expected && (
                          <div className="text-xs text-zinc-400">
                            <span className="text-zinc-500">Expected:</span> <span className="font-mono">{a.expected}</span>
                          </div>
                        )}
                        {a.actual && (
                          <div className="text-xs text-zinc-400">
                            <span className="text-zinc-500">Actual:</span> <span className="font-mono">{a.actual}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-500">No assertions</div>
            )}
          </div>
        </div>

        {/* Request */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Request</h4>
          <div className="space-y-3">
            {result.evidence?.request ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-xs font-mono font-semibold border border-sky-500/30">
                    {result.evidence.request.method}
                  </span>
                </div>
                <div className="text-xs text-zinc-300 font-mono break-all bg-zinc-900/50 p-2 rounded border border-zinc-800">
                  {result.evidence.request.url}
                </div>
                {Object.entries(requestHeaders).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-zinc-500">Headers</div>
                    {Array.isArray(displayedReqHeaders) ? (
                      displayedReqHeaders.map(([k, v]) => (
                        <div key={k} className="text-xs text-zinc-400 font-mono">
                          <span className="text-zinc-500">{k}:</span> {v}
                        </div>
                      ))
                    ) : (
                      Object.entries(displayedReqHeaders).map(([k, v]) => (
                        <div key={k} className="text-xs text-zinc-400 font-mono">
                          <span className="text-zinc-500">{k}:</span> {v}
                        </div>
                      ))
                    )}
                    {!showMoreHeaders && Object.entries(requestHeaders).length > 3 && (
                      <button
                        onClick={() => setShowMoreHeaders(true)}
                        className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        show {Object.entries(requestHeaders).length - 3} more
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-zinc-500">No request data</div>
            )}
          </div>
        </div>

        {/* Response */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Response</h4>
          <div className="space-y-3">
            {result.evidence?.response ? (
              <>
                {result.evidence.response.status !== undefined && (
                  <div className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs font-semibold font-mono ${statusColor}`}>
                    {result.evidence.response.status}
                  </div>
                )}
                {Object.entries(responseHeaders).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-zinc-500">Headers</div>
                    {Array.isArray(displayedResHeaders) ? (
                      displayedResHeaders.map(([k, v]) => (
                        <div key={k} className="text-xs text-zinc-400 font-mono">
                          <span className="text-zinc-500">{k}:</span> {v}
                        </div>
                      ))
                    ) : (
                      Object.entries(displayedResHeaders).map(([k, v]) => (
                        <div key={k} className="text-xs text-zinc-400 font-mono">
                          <span className="text-zinc-500">{k}:</span> {v}
                        </div>
                      ))
                    )}
                    {!showMoreHeaders && Object.entries(responseHeaders).length > 3 && (
                      <button
                        onClick={() => setShowMoreHeaders(true)}
                        className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        show {Object.entries(responseHeaders).length - 3} more
                      </button>
                    )}
                  </div>
                )}
                {timings && Object.entries(timings).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-zinc-500">Timings</div>
                    {Object.entries(timings).map(([label, ms]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>{label}</span>
                          <span className="font-mono">{ms}ms</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500/60 rounded-full"
                            style={{ width: `${maxTiming > 0 ? (ms / maxTiming) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-zinc-500">No response data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const [runs, setRuns] = useState<Run[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadRuns(), loadResults(runId!)]).then(([r, res]) => {
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
      const queryMatch = !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.category.toLowerCase().includes(query.toLowerCase());
      return statusMatch && queryMatch;
    });
  }, [results, statusFilter, query]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Loading run details…</span>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="px-6 py-6 space-y-4">
        <div className="text-zinc-400 space-y-4">
          <p>Run not found</p>
          <Link href="/runs">
            <a className="text-sky-400 hover:text-sky-300 transition-colors">← Back to Runs</a>
          </Link>
        </div>
      </div>
    );
  }

  const passColor = run.passPct >= 95 ? 'text-emerald-400' : run.passPct >= 80 ? 'text-amber-400' : 'text-rose-400';
  const barColor = run.passPct >= 95 ? 'bg-emerald-500' : run.passPct >= 80 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Back link */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <Link href="/runs">
          <a className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5">
            <span>←</span>
            <span>Runs</span>
            <span className="text-zinc-600">›</span>
            <span className="font-mono">{run.id}</span>
          </a>
        </Link>
      </div>

      {/* Run header stat chips */}
      <div className="px-6 py-5 bg-zinc-900 border-b border-zinc-800 flex items-center gap-4 flex-wrap">
        <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${ENV_STYLE[run.env]}`}>
          {run.env}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold tabular-nums ${passColor}`}>{run.passPct}%</span>
          <div className="w-24 h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${run.passPct}%` }} />
          </div>
        </div>
        {[
          { label: 'Suite', value: run.suiteId.replace('suite_', ''), mono: true },
          { label: 'Failures', value: String(run.failures), color: run.failures > 0 ? 'text-rose-400' : 'text-zinc-400' },
          { label: 'Duration', value: run.duration },
          { label: 'Build', value: run.build, mono: true },
          { label: 'Rev', value: run.rev, mono: true },
          { label: 'Started', value: new Date(run.started).toLocaleString() },
        ].map(chip => (
          <div key={chip.label} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">{chip.label}</span>
            <span className={`text-sm ${chip.mono ? 'font-mono' : ''} ${(chip as any).color ?? 'text-zinc-200'}`}>
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
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                statusFilter === s
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search test name, category…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700/50 text-zinc-100 text-sm rounded-md pl-8 pr-3 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className="text-xs text-zinc-500">
          Showing <span className="text-zinc-400 font-medium">{paged.length}</span> of{' '}
          <span className="text-zinc-400 font-medium">{filtered.length}</span> tests
          {statusFilter === 'ALL' && ' · ' + results.filter(r => r.status === 'PASS').length + ' passed'}
          {statusFilter === 'ALL' && ' · ' + results.filter(r => r.status === 'FAIL').length + ' failed'}
        </div>

        {/* Test results table */}
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 border-b border-zinc-800">
              <tr>
                {['Name', 'Category', 'Status', 'Duration', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {paged.length > 0 ? (
                paged.map(result => (
                  <React.Fragment key={result.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                      className={`cursor-pointer transition-colors ${result.status === 'FAIL' ? 'bg-rose-950/10' : ''} hover:bg-zinc-800/40`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-100">{result.name}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{result.category}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={result.status} />
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-400">{formatDuration(result.duration)}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${expandedId === result.id ? 'rotate-180' : ''}`}
                        />
                      </td>
                    </tr>
                    {expandedId === result.id && (
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
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
                    <div className="text-zinc-600 text-sm">No tests match the current filters</div>
                    <button
                      onClick={() => {
                        setStatusFilter('ALL');
                        setQuery('');
                      }}
                      className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors"
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
              <span className="text-xs text-zinc-500">
                Page {page} of {pageCount} · {filtered.length} items
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
                >
                  «
                </button>
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
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
                          ? 'bg-sky-500/20 text-sky-400 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === pageCount}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
                >
                  ›
                </button>
                <button
                  onClick={() => setPage(pageCount)}
                  disabled={page === pageCount}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-zinc-800 transition-colors"
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
