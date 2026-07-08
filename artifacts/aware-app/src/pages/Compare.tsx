import React, { useEffect, useMemo, useState, useRef, useTransition } from 'react';
import { useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus, Plus, ChevronDown, CheckCircle2, XCircle, ExternalLink, Check, ArrowLeftRight, GitCompare } from 'lucide-react';
import { loadRuns, loadAllResults, loadTestCases, getTestCaseById } from '@/lib/data';
import { getGitHubUrl } from '@/lib/utils';
import { dropDown, fastStagger, fadeUp, scaleIn, fadeIn } from '@/lib/motion';
import { envSelectClass } from '@/lib/envStyles';
import type { Run, TestResult } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
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
        className="w-full flex items-center justify-between gap-2 bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-lg px-3 py-2.5 hover:border-gcp-blue/40 focus:outline-none focus:border-gcp-blue/50 focus:ring-2 focus:ring-gcp-blue/20 transition-all shadow-sm"
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
        <ChevronDown size={14} className={`text-gcp-text-muted flex-shrink-0 transition-all duration-200 ${open ? 'rotate-180 text-gcp-blue' : ''}`} />
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
            className="absolute z-50 mt-1.5 w-full backdrop-blur-xl bg-gcp-elevated/95 border border-gcp-border-soft rounded-xl shadow-2xl max-h-72 overflow-y-auto"
          >
            <div className="py-1">
              {sorted.map(r => {
                const isSelected = r.id === value;
                return (
                  <button
                    key={r.id}
                    onClick={() => { onChange(r.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left text-sm transition-all duration-150 border-l-2 ${
                      isSelected
                        ? 'bg-gcp-blue/10 border-l-gcp-blue'
                        : 'border-l-transparent hover:bg-gcp-surface/60 hover:border-l-gcp-blue/40'
                    }`}
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border flex-shrink-0 ${envSelectClass(r.env)}`}>
                      {r.env}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-gcp-text truncate font-medium">{r.label}</div>
                      <div className="text-gcp-text-muted text-[11px] mt-0.5">
                        {r.suiteId.replace('suite_', '')} · {new Date(r.started).toLocaleDateString()} {new Date(r.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex-shrink-0 bg-gcp-blue/20 rounded-full p-0.5">
                        <Check size={12} className="text-gcp-blue" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
      <div className="text-center py-4 text-gcp-text-muted text-xs italic">
        No data
      </div>
    );
  }

  const assertions = result.evidence?.assertions ?? [];
  return (
    <div className="space-y-2.5 text-xs">
      {assertions.length === 0 ? (
        <div className="text-gcp-text-muted italic">No assertions recorded</div>
      ) : (
        assertions.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: side === 'left' ? -6 : 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className={`flex items-start gap-2.5 rounded-lg p-2.5 border-l-2 ${
              a.pass
                ? 'border-l-gcp-green bg-gcp-green-bg/30'
                : 'border-l-gcp-red bg-gcp-red-bg/30'
            }`}
          >
            {a.pass ? (
              <span className="flex-shrink-0 mt-0.5 bg-gcp-green/15 rounded-full p-0.5">
                <CheckCircle2 size={12} className="text-gcp-green" />
              </span>
            ) : (
              <span className="flex-shrink-0 mt-0.5 bg-gcp-red/15 rounded-full p-0.5">
                <XCircle size={12} className="text-gcp-red" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className={`font-medium break-words ${a.pass ? 'text-gcp-text' : 'text-gcp-text'}`}>{a.label}</div>
              {!a.pass && (
                <div className="text-gcp-text-muted mt-1.5 space-y-0.5 text-[11px]">
                  {a.expected && <div><span className="text-gcp-text-secondary">Expected:</span> <span className="font-mono text-gcp-text-muted">{a.expected}</span></div>}
                  {a.actual && <div><span className="text-gcp-text-secondary">Actual:</span> <span className="font-mono text-gcp-red-light">{a.actual}</span></div>}
                </div>
              )}
            </div>
          </motion.div>
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
    <div className="grid grid-cols-2 gap-5 text-xs">
      {/* Baseline */}
      <div className="space-y-4">
        <div className="backdrop-blur-sm bg-gcp-surface/40 rounded-lg border border-gcp-border/40 p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gcp-blue" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text">Baseline Assertions</h4>
          </div>
          <AssertionBlock result={diff.baseResult} side="left" />
        </div>

        {baseReq && (
          <div className="backdrop-blur-sm bg-gcp-surface/40 rounded-lg border border-gcp-border/40 p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-gcp-text-muted" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text-muted">Request</h4>
            </div>
            <div className="space-y-2.5 text-gcp-text-secondary">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 bg-gcp-border/60 text-gcp-text-secondary rounded font-mono text-[10px] font-semibold">{baseReq.method}</span>
                <span className="font-mono text-[11px] break-all text-gcp-text-secondary">{baseReq.url}</span>
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
      <div className="space-y-4">
        <div className="backdrop-blur-sm bg-gcp-surface/40 rounded-lg border border-gcp-border/40 p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gcp-green" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text">Candidate Assertions</h4>
          </div>
          <AssertionBlock result={diff.candResult} side="right" />
        </div>

        {candReq && (
          <div className="backdrop-blur-sm bg-gcp-surface/40 rounded-lg border border-gcp-border/40 p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-gcp-text-muted" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gcp-text-muted">Request</h4>
            </div>
            <div className="space-y-2.5 text-gcp-text-secondary">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 bg-gcp-border/60 text-gcp-text-secondary rounded font-mono text-[10px] font-semibold">{candReq.method}</span>
                <span className="font-mono text-[11px] break-all text-gcp-text-secondary">{candReq.url}</span>
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
          <div className="w-6 h-6 border-2 border-gcp-blue/30 border-t-gcp-blue rounded-full animate-spin" />
          <span className="text-sm text-gcp-text-muted">Loading runs…</span>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper className="px-6 py-6 space-y-6">
      {/* Run selector area */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-gcp-blue via-gcp-blue-light to-gcp-blue/20" />
          <h1 className="text-xl font-semibold tracking-tight text-gcp-text">Compare Runs</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          {/* Baseline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-2">Baseline (Before)</label>
            <select
              value={baseId}
              onChange={e => setBaseId(e.target.value)}
              className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-lg px-3 py-2.5 placeholder:text-gcp-text-muted appearance-none focus:outline-none focus:border-gcp-blue/50 focus:ring-2 focus:ring-gcp-blue/20 transition-all shadow-sm cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e7687' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '32px',
              }}
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
              className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-sm rounded-lg px-3 py-2.5 placeholder:text-gcp-text-muted appearance-none focus:outline-none focus:border-gcp-blue/50 focus:ring-2 focus:ring-gcp-blue/20 transition-all shadow-sm cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236e7687' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: '32px',
              }}
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gcp-elevated border border-gcp-border-soft text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-surface hover:border-gcp-blue/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          >
            <ArrowLeftRight size={14} className="transition-transform duration-200 group-hover:rotate-180" />
            Swap
          </button>

          <motion.button
            onClick={handleCompare}
            disabled={!baseId || !candId || isComparing}
            whileHover={baseId && candId && !isComparing ? { scale: 1.02 } : {}}
            whileTap={baseId && candId && !isComparing ? { scale: 0.97 } : {}}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-gcp-blue to-gcp-blue-hover hover:from-gcp-blue-hover hover:to-gcp-blue disabled:from-gcp-border disabled:to-gcp-border disabled:cursor-not-allowed text-white text-sm rounded-lg font-semibold transition-all duration-150 shadow-md hover:shadow-lg hover:shadow-gcp-blue/20 disabled:shadow-none"
          >
            <GitCompare size={16} />
            {isComparing ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Comparing…
              </span>
            ) : (
              'Compare'
            )}
          </motion.button>
        </div>
      </div>

      {/* Summary cards (CTA) */}
      {diffs.length > 0 && (
        <motion.div
          variants={fastStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-4"
        >
          <motion.div variants={fadeUp}>
            <button
              onClick={() => startTransition(() => setChangeFilter(changeFilter === 'REGRESSED' ? 'ALL' : 'REGRESSED'))}
              className={`w-full rounded-xl border p-4 flex items-center gap-3 text-left transition-all duration-200 ${
                changeFilter === 'REGRESSED'
                  ? 'bg-gcp-red/15 border-gcp-red/40 ring-2 ring-gcp-red/30 shadow-lg shadow-gcp-red/10 backdrop-blur-sm'
                  : 'bg-gcp-red/10 border-gcp-red/20 hover:bg-gcp-red/15 hover:border-gcp-red/30 hover:shadow-md backdrop-blur-sm'
              }`}
            >
              <span className={`p-2 rounded-lg ${changeFilter === 'REGRESSED' ? 'bg-gcp-red/20' : 'bg-gcp-red/10'}`}>
                <TrendingDown size={20} className="text-gcp-red" />
              </span>
              <div>
                <div className="text-2xl font-bold text-gcp-red">{summary.regressions}</div>
                <div className="text-xs text-gcp-red/70 font-medium">Regressions</div>
              </div>
            </button>
          </motion.div>

          <motion.div variants={fadeUp}>
            <button
              onClick={() => startTransition(() => setChangeFilter(changeFilter === 'FIXED' ? 'ALL' : 'FIXED'))}
              className={`w-full rounded-xl border p-4 flex items-center gap-3 text-left transition-all duration-200 ${
                changeFilter === 'FIXED'
                  ? 'bg-gcp-green/15 border-gcp-green/40 ring-2 ring-gcp-green/30 shadow-lg shadow-gcp-green/10 backdrop-blur-sm'
                  : 'bg-gcp-green/10 border-gcp-green/20 hover:bg-gcp-green/15 hover:border-gcp-green/30 hover:shadow-md backdrop-blur-sm'
              }`}
            >
              <span className={`p-2 rounded-lg ${changeFilter === 'FIXED' ? 'bg-gcp-green/20' : 'bg-gcp-green/10'}`}>
                <TrendingUp size={20} className="text-gcp-green" />
              </span>
              <div>
                <div className="text-2xl font-bold text-gcp-green">{summary.fixed}</div>
                <div className="text-xs text-gcp-green/70 font-medium">Fixed</div>
              </div>
            </button>
          </motion.div>

          <motion.div variants={fadeUp}>
            <button
              onClick={() => startTransition(() => setChangeFilter(changeFilter === 'UNCHANGED' ? 'ALL' : 'UNCHANGED'))}
              className={`w-full rounded-xl border p-4 flex items-center gap-3 text-left transition-all duration-200 ${
                changeFilter === 'UNCHANGED'
                  ? 'bg-gcp-blue/15 border-gcp-blue/40 ring-2 ring-gcp-blue/30 shadow-lg shadow-gcp-blue/10 backdrop-blur-sm'
                  : 'bg-gcp-elevated border-gcp-border hover:bg-gcp-elevated/50 hover:border-gcp-border-soft hover:shadow-md backdrop-blur-sm'
              }`}
            >
              <span className={`p-2 rounded-lg ${changeFilter === 'UNCHANGED' ? 'bg-gcp-blue/20' : 'bg-gcp-border/40'}`}>
                <Minus size={20} className={changeFilter === 'UNCHANGED' ? 'text-gcp-blue' : 'text-gcp-text-secondary'} />
              </span>
              <div>
                <div className="text-2xl font-bold text-gcp-text-secondary">{summary.unchanged}</div>
                <div className="text-xs text-gcp-text-muted font-medium">Unchanged</div>
              </div>
            </button>
          </motion.div>

          <motion.div variants={fadeUp}>
            <button
              onClick={() => startTransition(() => setChangeFilter(changeFilter === 'NEW' ? 'ALL' : 'NEW'))}
              className={`w-full rounded-xl border p-4 flex items-center gap-3 text-left transition-all duration-200 ${
                changeFilter === 'NEW'
                  ? 'bg-gcp-yellow/15 border-gcp-yellow/40 ring-2 ring-gcp-yellow/30 shadow-lg shadow-gcp-yellow/10 backdrop-blur-sm'
                  : 'bg-gcp-yellow/10 border-gcp-yellow/20 hover:bg-gcp-yellow/15 hover:border-gcp-yellow/30 hover:shadow-md backdrop-blur-sm'
              }`}
            >
              <span className={`p-2 rounded-lg ${changeFilter === 'NEW' ? 'bg-gcp-yellow/20' : 'bg-gcp-yellow/10'}`}>
                <Plus size={20} className="text-gcp-yellow" />
              </span>
              <div>
                <div className="text-2xl font-bold text-gcp-yellow">{summary.newOrRemoved}</div>
                <div className="text-xs text-gcp-yellow/70 font-medium">New / Removed</div>
              </div>
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Change filter tabs */}
      {diffs.length > 0 && (
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-sm bg-gcp-surface/50 border border-gcp-border/30 w-fit">
          {(['ALL', 'REGRESSED', 'FIXED', 'UNCHANGED', 'NEW', 'REMOVED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setChangeFilter(f)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                changeFilter === f
                  ? 'text-gcp-blue-light bg-gcp-blue/15 shadow-sm'
                  : 'text-gcp-text-secondary hover:text-gcp-text hover:bg-gcp-elevated/60'
              }`}
            >
              {changeFilter === f && (
                <motion.span
                  layoutId="filter-underline"
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-gcp-blue to-gcp-blue-light"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {f === 'ALL' ? 'All Changes' : f}
            </button>
          ))}
        </div>
      )}

      {/* Results table */}
      {diffs.length > 0 && (
        <div className="rounded-xl border border-gcp-border/60 overflow-hidden shadow-sm backdrop-blur-sm bg-gcp-surface/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gcp-surface/80 border-b border-gcp-border/60">
                <SortHeader label="Name" sortKey="name" currentSort={sort} onToggle={toggle} filterValue={colNameFilter} onFilterChange={setColNameFilter} />
                <SortHeader label="Category" sortKey="category" currentSort={sort} onToggle={toggle} filterValue={colCatFilter} onFilterChange={setColCatFilter} />
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted">Baseline</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted">Candidate</th>
                <SortHeader label="Change" sortKey="change" currentSort={sort} onToggle={toggle} />
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted" />
              </tr>
            </thead>
            <motion.tbody
              variants={fastStagger}
              initial="hidden"
              animate="visible"
              className="divide-y divide-gcp-border/40"
            >
              {paged.map(d => (
                <React.Fragment key={d.name}>
                  <motion.tr
                    variants={fadeUp}
                    onClick={() => setExpandedId(expandedId === d.name ? null : d.name)}
                    className={`cursor-pointer transition-all duration-150 border-l-2 ${
                      expandedId === d.name
                        ? 'border-l-gcp-blue bg-gcp-elevated/40'
                        : d.change === 'REGRESSED'
                          ? 'border-l-gcp-red/50 bg-gcp-red/8 hover:bg-gcp-red/12'
                          : d.change === 'FIXED'
                            ? 'border-l-gcp-green/50 bg-gcp-green/8 hover:bg-gcp-green/12'
                            : 'border-l-transparent hover:bg-gcp-elevated/30 hover:border-l-gcp-blue/30'
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
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-gcp-border/30 rounded text-[11px] text-gcp-text-secondary font-medium">
                        {d.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.baseResult ? <StatusBadge status={d.baseResult.status} size="sm" /> : <span className="text-xs text-gcp-text-muted italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.candResult ? <StatusBadge status={d.candResult.status} size="sm" /> : <span className="text-xs text-gcp-text-muted italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.change === 'REGRESSED' ? 'text-gcp-red bg-gcp-red/12' :
                        d.change === 'FIXED' ? 'text-gcp-green bg-gcp-green/12' :
                        d.change === 'NEW' || d.change === 'REMOVED' ? 'text-gcp-yellow bg-gcp-yellow/12' :
                        'text-gcp-text-secondary bg-gcp-border/30'
                      }`}>
                        {d.change === 'REGRESSED' && <TrendingDown size={10} />}
                        {d.change === 'FIXED' && <TrendingUp size={10} />}
                        {d.change}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gcp-text-muted">
                      <motion.span
                        animate={{ rotate: expandedId === d.name ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center justify-center"
                      >
                        <ChevronDown size={14} />
                      </motion.span>
                    </td>
                  </motion.tr>
                  {expandedId === d.name && (
                    <motion.tr
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                    >
                      <td colSpan={6} className="px-6 py-5 border-b border-gcp-border/40 bg-gradient-to-b from-gcp-surface/50 to-transparent">
                        <DiffPanel diff={d} />
                      </td>
                    </motion.tr>
                  )}
                </React.Fragment>
              ))}
            </motion.tbody>
          </table>

          {filtered.length === 0 && diffs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gcp-border/30 mb-4">
                <Minus size={20} className="text-gcp-text-muted" />
              </div>
              <div className="text-gcp-text-muted text-sm">No changes match the current filter</div>
              <button
                onClick={() => startTransition(() => setChangeFilter('ALL'))}
                className="mt-3 text-xs text-gcp-blue hover:text-gcp-blue-light transition-colors underline underline-offset-2 decoration-gcp-blue/30 hover:decoration-gcp-blue/60"
              >
                Clear filter
              </button>
            </motion.div>
          )}

          <Pagination page={page} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
        </div>
      )}

      {/* Empty state when no comparison has been run yet */}
      {diffs.length === 0 && !isComparing && runs.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gcp-border/30 mb-4">
            <GitCompare size={28} className="text-gcp-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-gcp-text mb-1">Select two runs to compare</h3>
          <p className="text-sm text-gcp-text-muted max-w-xs mx-auto">
            Choose a baseline and candidate run above, then click Compare to see the diff.
          </p>
        </motion.div>
      )}
    </PageWrapper>
  );
}
