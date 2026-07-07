import { useEffect, useMemo, useState } from 'react';
import { useSearch } from 'wouter';
import { loadRuns, loadAllResults } from '@/lib/data';
import type { Run, TestResult } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

type DiffRow = {
  name: string;
  category: string;
  baseStatus: string | null;
  candStatus: string | null;
  baseDur: number | null;
  candDur: number | null;
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
      baseStatus: b?.status ?? null,
      candStatus: c?.status ?? null,
      baseDur: b?.duration ?? null,
      candDur: c?.duration ?? null,
      change,
    };
  }).sort((a, b) => {
    const order = { REGRESSED: 0, FIXED: 1, NEW: 2, REMOVED: 3, UNCHANGED: 4 };
    return order[a.change] - order[b.change];
  });
}

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

  useEffect(() => {
    loadRuns().then(r => {
      setRuns(r);
      setLoading(false);
      if (!baseId && r.length > 0) setBaseId(r[0].id);
      if (!candId && r.length > 1) setCandId(r[1].id);
    });
  }, []);

  const handleCompare = async () => {
    if (!baseId || !candId) return;
    setIsComparing(true);
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

  const summary = useMemo(() => {
    const regressions = diffs.filter(d => d.change === 'REGRESSED').length;
    const fixed = diffs.filter(d => d.change === 'FIXED').length;
    const unchanged = diffs.filter(d => d.change === 'UNCHANGED').length;
    return { regressions, fixed, unchanged };
  }, [diffs]);

  if (loading) return <div className="p-8 text-zinc-400">Loading…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-zinc-100">Compare Runs</h1>
        
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-2">Baseline (Before)</label>
            <select
              value={baseId}
              onChange={e => setBaseId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-3 py-2"
            >
              <option value="">Select baseline run…</option>
              {[...runs].sort((a, b) => b.started.localeCompare(a.started)).map(r => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.env}) - {new Date(r.started).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm text-zinc-400 mb-2">Candidate (After)</label>
            <select
              value={candId}
              onChange={e => setCandId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-3 py-2"
            >
              <option value="">Select candidate run…</option>
              {[...runs].sort((a, b) => b.started.localeCompare(a.started)).map(r => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.env}) - {new Date(r.started).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompare}
            disabled={!baseId || !candId || isComparing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-100 text-sm rounded font-semibold transition-colors"
          >
            {isComparing ? 'Comparing…' : 'Compare'}
          </button>
        </div>
      </div>

      {diffs.length > 0 && (
        <>
          <div className="text-xs text-zinc-400">
            {summary.regressions} regressions · {summary.fixed} fixed · {summary.unchanged} unchanged
          </div>

          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  {['Name', 'Category', 'Baseline', 'Candidate', 'Duration Δ', 'Change'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {diffs.map(d => {
                  let rowClass = '';
                  if (d.change === 'REGRESSED') rowClass = 'bg-red-950/20 border-l-2 border-l-red-600';
                  else if (d.change === 'FIXED') rowClass = 'bg-emerald-950/20 border-l-2 border-l-emerald-600';
                  else if (d.change === 'NEW' || d.change === 'REMOVED') rowClass = 'bg-zinc-900';
                  
                  return (
                    <tr key={d.name} className={`hover:bg-zinc-800/50 transition-colors ${rowClass}`}>
                      <td className="px-4 py-2 text-zinc-100 font-mono text-xs">{d.name}</td>
                      <td className="px-4 py-2 text-zinc-400 text-xs">{d.category}</td>
                      <td className="px-4 py-2">
                        {d.baseStatus ? <StatusBadge status={d.baseStatus} /> : <span className="text-zinc-500 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-2">
                        {d.candStatus ? <StatusBadge status={d.candStatus} /> : <span className="text-zinc-500 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-2 text-xs font-mono">
                        {d.baseDur !== null && d.candDur !== null ? (
                          <span className={d.candDur - d.baseDur > 0 ? 'text-red-400' : 'text-emerald-400'}>
                            {d.candDur - d.baseDur > 0 ? '+' : ''}{d.candDur - d.baseDur}ms
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span className={
                          d.change === 'REGRESSED' ? 'text-red-400 font-semibold' :
                          d.change === 'FIXED' ? 'text-emerald-400 font-semibold' :
                          'text-zinc-400'
                        }>
                          {d.change}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
