import React, { useEffect, useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { TrendingDown, TrendingUp, Minus, Plus, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { loadRuns, loadAllResults } from '@/lib/data';
import type { Run, TestResult } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

type DiffRow = {
  name: string;
  category: string;
  baseResult: TestResult | null;
  candResult: TestResult | null;
  change: 'REGRESSED' | 'FIXED' | 'UNCHANGED' | 'NEW' | 'REMOVED';
};

function computeDiff(base: TestResult[], cand: TestResult[]): DiffRow[] {
  const byName = (arr: TestResult[]) => new Map(arr.map(t => [t.name, t]));
  const bm = byName(base);
  const cm = byName(cand);
  const names = new Set([...bm.keys(), ...cm.keys()]);
  return [...names].map(name => {
    const b = bm.get(name);
    const c = cm.get(name);
    let change: DiffRow['change'] = 'UNCHANGED';
    if (!b) change = 'NEW';
    else if (!c) change = 'REMOVED';
    else if (b.status === 'PASS' && c.status === 'FAIL') change = 'REGRESSED';
    else if (b.status === 'FAIL' && c.status === 'PASS') change = 'FIXED';
    return {
      name,
      category: b?.category ?? c?.category ?? '',
      baseResult: b ?? null,
      candResult: c ?? null,
      change,
    };
  }).sort((a, b) => {
    const order = { REGRESSED: 0, FIXED: 1, NEW: 2, REMOVED: 3, UNCHANGED: 4 };
    return order[a.change] - order[b.change];
  });
}

function AssertionBlock({ result, side }: { result: TestResult | null; side: 'left' | 'right' }) {
  if (!result) {
    return (
      <div className="text-center py-4 text-zinc-600 text-xs">
        —
      </div>
    );
  }

  const assertions = result.evidence?.assertions ?? [];
  return (
    <div className="space-y-2 text-xs">
      {assertions.length === 0 ? (
        <div className="text-zinc-600">No assertions</div>
      ) : (
        assertions.map((a, i) => (
          <div key={i} className="flex items-start gap-2">
            {a.pass ? (
              <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-zinc-300 break-words">{a.label}</div>
              {!a.pass && (
                <div className="text-zinc-600 mt-1 space-y-0.5">
                  {a.expected && <div>Expected: <span className="font-mono text-zinc-500">{a.expected}</span></div>}
                  {a.actual && <div>Actual: <span className="font-mono text-zinc-500">{a.actual}</span></div>}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DiffPanel({ diff }: { diff: DiffRow }) {
  const baseReq = diff.baseResult?.evidence?.request;
  const baseResp = diff.baseResult?.evidence?.response;
  const candReq = diff.candResult?.evidence?.request;
  const candResp = diff.candResult?.evidence?.response;

  return (
    <div className="grid grid-cols-2 gap-6 text-xs">
      {/* Baseline */}
      <div>
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Baseline Assertions</h4>
          <AssertionBlock result={diff.baseResult} side="left" />
        </div>

        {baseReq && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Request</h4>
            <div className="space-y-2 text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded font-mono text-[10px] font-semibold">{baseReq.method}</span>
                <span className="font-mono text-[11px] truncate text-zinc-400">{baseReq.url}</span>
              </div>
              {baseResp && (
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${baseResp.status >= 200 && baseResp.status < 300 ? 'bg-emerald-500/20 text-emerald-400' : baseResp.status >= 400 && baseResp.status < 500 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {baseResp.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Candidate */}
      <div>
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Candidate Assertions</h4>
          <AssertionBlock result={diff.candResult} side="right" />
        </div>

        {candReq && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Request</h4>
            <div className="space-y-2 text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-zinc-700 text-zinc-300 rounded font-mono text-[10px] font-semibold">{candReq.method}</span>
                <span className="font-mono text-[11px] truncate text-zinc-400">{candReq.url}</span>
              </div>
              {candResp && (
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${candResp.status >= 200 && candResp.status < 300 ? 'bg-emerald-500/20 text-emerald-400' : candResp.status >= 400 && candResp.status < 500 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {candResp.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 50;

export default function Compare() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialBase = params.get('base');
  const initialCand = params.get('cand');

  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseId, setBaseId] = useState(initialBase ?? '');
  const [candId, setCandId] = useState(initialCand ?? '');
  const [diffs, setDiffs] = useState<DiffRow[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [changeFilter, setChangeFilter] = useState<'ALL' | 'REGRESSED' | 'FIXED' | 'UNCHANGED' | 'NEW' | 'REMOVED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadRuns().then(r => {
      setRuns(r);
      setLoading(false);
      if (!baseId && r.length > 0) setBaseId(r[0].id);
      if (!candId && r.length > 1) setCandId(r[1].id);
    });
  }, []);

  // Auto-compare on mount if both are set
  useEffect(() => {
    if (baseId && candId && diffs.length === 0 && !isComparing) {
      handleCompare();
    }
  }, [baseId, candId]);

  const handleCompare = async () => {
    if (!baseId || !candId) return;
    setIsComparing(true);
    setPage(1);
    try {
      const allResults = await loadAllResults();
      const baseResults = allResults[baseId] ?? [];
      const candResults = allResults[candId] ?? [];
      const diffRows = computeDiff(baseResults, candResults);
      setDiffs(diffRows);
    } finally {
      setIsComparing(false);
    }
  };

  const handleSwap = () => {
    const temp = baseId;
    setBaseId(candId);
    setCandId(temp);
  };

  const summary = useMemo(() => {
    const regressions = diffs.filter(d => d.change === 'REGRESSED').length;
    const fixed = diffs.filter(d => d.change === 'FIXED').length;
    const unchanged = diffs.filter(d => d.change === 'UNCHANGED').length;
    const newRemoved = diffs.filter(d => d.change === 'NEW' || d.change === 'REMOVED').length;
    return { regressions, fixed, unchanged, newOrRemoved: newRemoved };
  }, [diffs]);

  useEffect(() => setPage(1), [changeFilter]);

  const filtered = useMemo(() => {
    return diffs.filter(d => changeFilter === 'ALL' || d.change === changeFilter);
  }, [diffs, changeFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const baseRun = runs.find(r => r.id === baseId);
  const candRun = runs.find(r => r.id === candId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Loading runs…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Run selector area */}
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Compare Runs</h1>

        <div className="grid grid-cols-2 gap-4 items-end">
          {/* Baseline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Baseline (Before)</label>
            <select
              value={baseId}
              onChange={e => setBaseId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700/50 text-zinc-100 text-sm rounded-md px-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
            >
              <option value="">Select baseline run…</option>
              {[...runs].sort((a, b) => b.started.localeCompare(a.started)).map(r => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.env}) - {new Date(r.started).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Candidate (After)</label>
            <select
              value={candId}
              onChange={e => setCandId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700/50 text-zinc-100 text-sm rounded-md px-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
            >
              <option value="">Select candidate run…</option>
              {[...runs].sort((a, b) => b.started.localeCompare(a.started)).map(r => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.env}) - {new Date(r.started).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSwap}
            disabled={!baseId || !candId}
            className="px-3 py-2 rounded-md text-xs font-semibold bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ⇄ Swap
          </button>

          <button
            onClick={handleCompare}
            disabled={!baseId || !candId || isComparing}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm rounded-md font-semibold transition-colors"
          >
            {isComparing ? 'Comparing…' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {diffs.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 flex items-center gap-3">
            <TrendingDown size={20} className="text-rose-400 flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-rose-400">{summary.regressions}</div>
              <div className="text-xs text-rose-400/70 font-medium">Regressions</div>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
            <TrendingUp size={20} className="text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-emerald-400">{summary.fixed}</div>
              <div className="text-xs text-emerald-400/70 font-medium">Fixed</div>
            </div>
          </div>

          <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 flex items-center gap-3">
            <Minus size={20} className="text-zinc-400 flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-zinc-300">{summary.unchanged}</div>
              <div className="text-xs text-zinc-500 font-medium">Unchanged</div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-3">
            <Plus size={20} className="text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-amber-400">{summary.newOrRemoved}</div>
              <div className="text-xs text-amber-400/70 font-medium">New / Removed</div>
            </div>
          </div>
        </div>
      )}

      {/* Change filter tabs */}
      {diffs.length > 0 && (
        <div className="flex items-center gap-1.5">
          {(['ALL', 'REGRESSED', 'FIXED', 'UNCHANGED', 'NEW', 'REMOVED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setChangeFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                changeFilter === f
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}
            >
              {f === 'ALL' ? 'All Changes' : f}
            </button>
          ))}
        </div>
      )}

      {/* Results table */}
      {diffs.length > 0 && (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800">
                {['Name', 'Category', 'Baseline', 'Candidate', 'Change', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {paged.map(d => (
                <React.Fragment key={d.name}>
                  <tr
                    onClick={() => setExpandedId(expandedId === d.name ? null : d.name)}
                    className={`cursor-pointer transition-colors hover:bg-zinc-800/40 ${
                      d.change === 'REGRESSED' ? 'bg-rose-950/10' : d.change === 'FIXED' ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-100">{d.name}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{d.category}</td>
                    <td className="px-4 py-3">
                      {d.baseResult ? <StatusBadge status={d.baseResult.status} size="sm" /> : <span className="text-xs text-zinc-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.candResult ? <StatusBadge status={d.candResult.status} size="sm" /> : <span className="text-xs text-zinc-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        d.change === 'REGRESSED' ? 'text-rose-400' :
                        d.change === 'FIXED' ? 'text-emerald-400' :
                        d.change === 'NEW' || d.change === 'REMOVED' ? 'text-amber-400' :
                        'text-zinc-400'
                      }`}>
                        {d.change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      <ChevronDown size={14} className={`transition-transform ${expandedId === d.name ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {expandedId === d.name && (
                    <tr className="bg-zinc-900/50">
                      <td colSpan={6} className="px-6 py-4 border-b border-zinc-800">
                        <DiffPanel diff={d} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-zinc-600 text-sm">No changes match the current filter</div>
              <button
                onClick={() => setChangeFilter('ALL')}
                className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}

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
      )}
    </div>
  );
}
