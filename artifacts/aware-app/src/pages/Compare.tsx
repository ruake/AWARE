import React, { useEffect, useMemo, useState, useRef, useTransition } from 'react';
import { useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus, Plus, ChevronDown, CheckCircle2, XCircle, ExternalLink, Check } from 'lucide-react';
import { loadRuns, loadAllResults, loadTestCases, getTestCaseById } from '@/lib/data';
import { getGitHubUrl } from '@/lib/utils';
import { dropDown, fastStagger, fadeUp } from '@/lib/motion';
import { envSelectClass } from '@/lib/envStyles';
import type { Run, TestResult } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { PageWrapper } from '@/components/PageWrapper';
import { useSort, sortData, SortHeader } from '@/lib/sortableTable';

type DiffRow = {
  name: string;
  category: string;
  baseResult: TestResult | null;
  candResult: TestResult | null;
  change: 'REGRESSED' | 'FIXED' | 'UNCHANGED' | 'NEW' | 'REMOVED';
};

function CompositeSelect({
  runs,
  value,
  onChange,
  label,
}: {
  runs: Run[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sorted = useMemo(() => [...runs].sort((a, b) => b.started.localeCompare(a.started)), [runs]);
  const selected = runs.find(r => r.id === value);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-2">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-md px-3 py-2 hover:border-gcp-blue/50 focus:outline-none focus:border-gcp-blue/50 focus:ring-1 focus:ring-gcp-blue/20 transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border flex-shrink-0 ${envSelectClass(selected.env)}`}>
              {selected.env}
            </span>
            <span className="truncate">{selected.label}</span>
            <span className="text-gcp-text-muted text-xs flex-shrink-0 ml-auto">
              {new Date(selected.started).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <span className="text-gcp-text-muted">Select {label.toLowerCase()}…</span>
        )}
        <ChevronDown size={14} className={`text-gcp-text-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            variants={dropDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: 'top' }}
            className="absolute z-50 mt-1 w-full bg-gcp-elevated border border-gcp-border-soft rounded-md shadow-lg max-h-72 overflow-y-auto"
          >
            {sorted.map(r => {
              const isSelected = r.id === value;
              return (
                <button
                  key={r.id}
                  onClick={() => { onChange(r.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gcp-surface/60 border-b border-gcp-border/30 last:border-b-0 ${
                    isSelected ? 'bg-gcp-blue/10' : ''
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border flex-shrink-0 ${envSelectClass(r.env)}`}>
                    {r.env}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-gcp-text truncate">{r.label}</div>
                    <div className="text-gcp-text-muted text-[11px]">
                      {r.suiteId.replace('suite_', '')} · {new Date(r.started).toLocaleDateString()} {new Date(r.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-gcp-blue flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

const AssertionBlock = React.memo(function AssertionBlock({ result, side }: { result: TestResult | null; side: 'left' | 'right' }) {
  if (!result) {
    return (
      <div className="text-center py-4 text-gcp-text-muted text-xs">
        —
      </div>
    );
  }

  const assertions = result.evidence?.assertions ?? [];
  return (
    <div className="space-y-2 text-xs">
      {assertions.length === 0 ? (
        <div className="text-gcp-text-muted">No assertions</div>
      ) : (
        assertions.map((a, i) => (
          <div key={i} className="flex items-start gap-2">
            {a.pass ? (
              <CheckCircle2 size={14} className="text-gcp-green flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle size={14} className="text-gcp-red flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-gcp-text-secondary break-words">{a.label}</div>
              {!a.pass && (
                <div className="text-gcp-text-muted mt-1 space-y-0.5">
                  {a.expected && <div>Expected: <span className="font-mono text-gcp-text-muted">{a.expected}</span></div>}
                  {a.actual && <div>Actual: <span className="font-mono text-gcp-text-muted">{a.actual}</span></div>}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

const DiffPanel = React.memo(function DiffPanel({ diff }: { diff: DiffRow }) {
  const baseReq = diff.baseResult?.evidence?.request;
  const baseResp = diff.baseResult?.evidence?.response;
  const candReq = diff.candResult?.evidence?.request;
  const candResp = diff.candResult?.evidence?.response;

  return (
    <div className="grid grid-cols-2 gap-6 text-xs">
      {/* Baseline */}
      <div>
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text-muted mb-2">Baseline Assertions</h4>
          <AssertionBlock result={diff.baseResult} side="left" />
        </div>

        {baseReq && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text-muted mb-2">Request</h4>
            <div className="space-y-2 text-gcp-text-secondary">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gcp-border text-gcp-text-secondary rounded font-mono text-[10px] font-semibold">{baseReq.method}</span>
                <span className="font-mono text-[11px] truncate text-gcp-text-secondary">{baseReq.url}</span>
              </div>
              {baseResp && (
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${baseResp.status >= 200 && baseResp.status < 300 ? 'bg-gcp-green/20 text-gcp-green' : baseResp.status >= 400 && baseResp.status < 500 ? 'bg-gcp-yellow/20 text-gcp-yellow' : 'bg-gcp-red/20 text-gcp-red'}`}>
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
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text-muted mb-2">Candidate Assertions</h4>
          <AssertionBlock result={diff.candResult} side="right" />
        </div>

        {candReq && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text-muted mb-2">Request</h4>
            <div className="space-y-2 text-gcp-text-secondary">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gcp-border text-gcp-text-secondary rounded font-mono text-[10px] font-semibold">{candReq.method}</span>
                <span className="font-mono text-[11px] truncate text-gcp-text-secondary">{candReq.url}</span>
              </div>
              {candResp && (
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${candResp.status >= 200 && candResp.status < 300 ? 'bg-gcp-green/20 text-gcp-green' : candResp.status >= 400 && candResp.status < 500 ? 'bg-gcp-yellow/20 text-gcp-yellow' : 'bg-gcp-red/20 text-gcp-red'}`}>
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
});

const PAGE_SIZE = 25;

export default function Compare() {
  const [isPending, startTransition] = useTransition();
  const { sort, toggle } = useSort('change', 'asc');
  const [colNameFilter, setColNameFilter] = useState('');
  const [colCatFilter, setColCatFilter] = useState('');
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
    Promise.all([loadRuns(), loadTestCases()]).then(([r]) => {
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
    return diffs.filter(d => {
      if (changeFilter !== 'ALL' && d.change !== changeFilter) return false;
      if (colNameFilter && !d.name.toLowerCase().includes(colNameFilter.toLowerCase())) return false;
      if (colCatFilter && !d.category.toLowerCase().includes(colCatFilter.toLowerCase())) return false;
      return true;
    });
  }, [diffs, changeFilter, colNameFilter, colCatFilter]);

  const sorted = sortData(filtered, sort, {
    name: d => d.name.toLowerCase(),
    category: d => d.category.toLowerCase(),
    change: d => d.change,
  });

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const baseRun = runs.find(r => r.id === baseId);
  const candRun = runs.find(r => r.id === candId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-gcp-blue/30 border-t-sky-500 rounded-full animate-spin" />
          <span className="text-sm text-gcp-text-muted">Loading runs…</span>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper className="px-6 py-6 space-y-6">
      {/* Run selector area */}
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-gcp-text">Compare Runs</h1>

        <div className="grid grid-cols-2 gap-4 items-end">
          {/* Baseline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-2">Baseline (Before)</label>
            <select
              value={baseId}
              onChange={e => setBaseId(e.target.value)}
              className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-md px-3 py-2 placeholder:text-gcp-text-muted focus:outline-none focus:border-gcp-blue/50 focus:ring-1 focus:ring-gcp-blue/20 transition-colors"
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
            <label className="block text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-2">Candidate (After)</label>
            <select
              value={candId}
              onChange={e => setCandId(e.target.value)}
              className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-md px-3 py-2 placeholder:text-gcp-text-muted focus:outline-none focus:border-gcp-blue/50 focus:ring-1 focus:ring-gcp-blue/20 transition-colors"
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
            className="px-3 py-2 rounded-md text-xs font-semibold bg-gcp-elevated border border-gcp-border-soft text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-elevated/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ⇄ Swap
          </button>

          <button
            onClick={handleCompare}
            disabled={!baseId || !candId || isComparing}
            className="px-4 py-2 bg-gcp-blue hover:bg-gcp-blue-hover disabled:bg-gcp-border disabled:cursor-not-allowed text-white text-sm rounded-md font-semibold transition-colors"
          >
            {isComparing ? 'Comparing…' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Summary cards (CTA) */}
      {diffs.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => startTransition(() => setChangeFilter(changeFilter === 'REGRESSED' ? 'ALL' : 'REGRESSED'))}
            className={`rounded-lg border p-4 flex items-center gap-3 text-left transition-all ${
              changeFilter === 'REGRESSED'
                ? 'bg-gcp-red/15 border-gcp-red/40 ring-1 ring-gcp-red/30'
                : 'bg-gcp-red/10 border-gcp-red/20 hover:bg-gcp-red/15 hover:border-gcp-red/30'
            }`}
          >
            <TrendingDown size={20} className="text-gcp-red flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-gcp-red">{summary.regressions}</div>
              <div className="text-xs text-gcp-red/70 font-medium">Regressions</div>
            </div>
          </button>

          <button
            onClick={() => startTransition(() => setChangeFilter(changeFilter === 'FIXED' ? 'ALL' : 'FIXED'))}
            className={`rounded-lg border p-4 flex items-center gap-3 text-left transition-all ${
              changeFilter === 'FIXED'
                ? 'bg-gcp-green/15 border-gcp-green/40 ring-1 ring-gcp-green/30'
                : 'bg-gcp-green/10 border-gcp-green/20 hover:bg-gcp-green/15 hover:border-gcp-green/30'
            }`}
          >
            <TrendingUp size={20} className="text-gcp-green flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-gcp-green">{summary.fixed}</div>
              <div className="text-xs text-gcp-green/70 font-medium">Fixed</div>
            </div>
          </button>

          <button
            onClick={() => startTransition(() => setChangeFilter(changeFilter === 'UNCHANGED' ? 'ALL' : 'UNCHANGED'))}
            className={`rounded-lg border p-4 flex items-center gap-3 text-left transition-all ${
              changeFilter === 'UNCHANGED'
                ? 'bg-gcp-blue/15 border-gcp-blue/40 ring-1 ring-gcp-blue/30'
                : 'bg-gcp-elevated border-gcp-border hover:bg-gcp-elevated/50 hover:border-gcp-border-soft'
            }`}
          >
            <Minus size={20} className="text-gcp-text-secondary flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-gcp-text-secondary">{summary.unchanged}</div>
              <div className="text-xs text-gcp-text-muted font-medium">Unchanged</div>
            </div>
          </button>

          <button
            onClick={() => startTransition(() => setChangeFilter(changeFilter === 'NEW' ? 'ALL' : 'NEW'))}
            className={`rounded-lg border p-4 flex items-center gap-3 text-left transition-all ${
              changeFilter === 'NEW'
                ? 'bg-gcp-yellow/15 border-gcp-yellow/40 ring-1 ring-gcp-yellow/30'
                : 'bg-gcp-yellow/10 border-gcp-yellow/20 hover:bg-gcp-yellow/15 hover:border-gcp-yellow/30'
            }`}
          >
            <Plus size={20} className="text-gcp-yellow flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-gcp-yellow">{summary.newOrRemoved}</div>
              <div className="text-xs text-gcp-yellow/70 font-medium">New / Removed</div>
            </div>
          </button>
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
                  ? 'bg-gcp-blue/20 text-gcp-blue-light border-gcp-blue/30'
                  : 'bg-gcp-elevated text-gcp-text-secondary border-gcp-border-soft hover:text-gcp-text hover:bg-gcp-elevated/50'
              }`}
            >
              {f === 'ALL' ? 'All Changes' : f}
            </button>
          ))}
        </div>
      )}

      {/* Results table */}
      {diffs.length > 0 && (
        <div className="rounded-lg border border-gcp-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gcp-surface/80 border-b border-gcp-border">
                <SortHeader label="Name" sortKey="name" currentSort={sort} onToggle={toggle} filterValue={colNameFilter} onFilterChange={setColNameFilter} />
                <SortHeader label="Category" sortKey="category" currentSort={sort} onToggle={toggle} filterValue={colCatFilter} onFilterChange={setColCatFilter} />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted">Baseline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted">Candidate</th>
                <SortHeader label="Change" sortKey="change" currentSort={sort} onToggle={toggle} />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted" />
              </tr>
            </thead>
            <motion.tbody
              variants={fastStagger}
              initial="hidden"
              animate="visible"
              className="divide-y divide-gcp-border/70"
            >
              {paged.map(d => (
                <React.Fragment key={d.name}>
                  <motion.tr
                    variants={fadeUp}
                    onClick={() => setExpandedId(expandedId === d.name ? null : d.name)}
                    className={`cursor-pointer transition-colors hover:bg-gcp-elevated/40 ${
                      d.change === 'REGRESSED' ? 'bg-gcp-red/10' : d.change === 'FIXED' ? 'bg-gcp-green/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gcp-text">{d.name}</span>
                        {(() => {
                          const result = d.baseResult ?? d.candResult;
                          const tc = result ? getTestCaseById(result.testCaseId) : undefined;
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
                    <td className="px-4 py-3 text-xs text-gcp-text-secondary">{d.category}</td>
                    <td className="px-4 py-3">
                      {d.baseResult ? <StatusBadge status={d.baseResult.status} size="sm" /> : <span className="text-xs text-gcp-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.candResult ? <StatusBadge status={d.candResult.status} size="sm" /> : <span className="text-xs text-gcp-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        d.change === 'REGRESSED' ? 'text-gcp-red' :
                        d.change === 'FIXED' ? 'text-gcp-green' :
                        d.change === 'NEW' || d.change === 'REMOVED' ? 'text-gcp-yellow' :
                        'text-gcp-text-secondary'
                      }`}>
                        {d.change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gcp-text-muted">
                      <ChevronDown size={14} className={`transition-transform ${expandedId === d.name ? 'rotate-180' : ''}`} />
                    </td>
                  </motion.tr>
                  {expandedId === d.name && (
                    <tr className="bg-gcp-surface/50">
                      <td colSpan={6} className="px-6 py-4 border-b border-gcp-border">
                        <DiffPanel diff={d} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </motion.tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-gcp-text-muted text-sm">No changes match the current filter</div>
              <button
                onClick={() => startTransition(() => setChangeFilter('ALL'))}
                className="mt-3 text-xs text-gcp-blue hover:text-gcp-blue-light transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gcp-border bg-gcp-surface/50">
              <span className="text-xs text-gcp-text-muted">
                Page {page} of {pageCount} · {filtered.length} items
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
      )}
    </PageWrapper>
  );
}
