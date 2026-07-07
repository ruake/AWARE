import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'wouter';
import { loadRuns, loadResults } from '@/lib/data';
import type { Run, TestResult } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const [runs, setRuns] = useState<Run[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadRuns(), loadResults(runId!)]).then(([r, res]) => {
      setRuns(r);
      setResults(res);
      setLoading(false);
    });
  }, [runId]);

  const run = useMemo(() => runs.find(r => r.id === runId), [runs, runId]);

  const filtered = useMemo(() => {
    return results.filter(r => statusFilter === 'ALL' || r.status === statusFilter);
  }, [results, statusFilter]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading…</div>;
  }

  if (!run) {
    return (
      <div className="p-8 text-zinc-400">
        <p>Run not found</p>
        <Link href="/runs">
          <a className="text-blue-400 hover:text-blue-300">← Back to Runs</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/runs">
        <a className="text-blue-400 hover:text-blue-300 text-sm">← Runs</a>
      </Link>

      {/* Run header */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold text-zinc-100">{run.id}</span>
          <StatusBadge status={run.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400">
          <div>Env: {run.env}</div>
          <div>Suite: {run.suiteId}</div>
          <div>Pass Rate: <span className="text-zinc-100">{run.passPct}%</span></div>
          <div>Failures: <span className="text-zinc-100">{run.failures}</span></div>
          <div>Duration: <span className="text-zinc-100">{run.duration}</span></div>
          <div>Build: <span className="font-mono text-zinc-100">{run.build}</span></div>
          <div>Started: <span className="text-zinc-100">{new Date(run.started).toLocaleString()}</span></div>
          <div>Revision: <span className="font-mono text-zinc-100">{run.rev}</span></div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-400">Status:</label>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'ALL' | 'PASS' | 'FAIL')}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-3 py-1.5"
        >
          <option value="ALL">All</option>
          <option value="PASS">PASS</option>
          <option value="FAIL">FAIL</option>
        </select>
        <span className="text-sm text-zinc-500">Showing {filtered.length} of {results.length} tests</span>
      </div>

      {/* Test results table */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800">
            <tr>
              {['Name', 'Category', 'Status', 'Duration'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map(result => (
              <tr
                key={result.id}
                onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                className={`cursor-pointer ${result.status === 'FAIL' ? 'bg-red-950/20' : ''} hover:bg-zinc-800/50 transition-colors`}
              >
                <td className="px-4 py-3 font-mono text-zinc-100">{result.name}</td>
                <td className="px-4 py-3 text-zinc-400">{result.category}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={result.status} />
                </td>
                <td className="px-4 py-3 text-zinc-400">{formatDuration(result.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded evidence for FAIL rows */}
      {expandedId && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          {(() => {
            const result = filtered.find(r => r.id === expandedId);
            if (!result) return null;
            return (
              <div className="space-y-3">
                <div className="font-semibold text-zinc-100">{result.name} — Evidence</div>
                
                {result.evidence?.request && (
                  <div className="text-sm">
                    <div className="font-mono text-zinc-400 mb-1">Request:</div>
                    <div className="ml-4 space-y-1 text-zinc-400">
                      <div>{result.evidence.request.method} {result.evidence.request.url}</div>
                      {Object.entries(result.evidence.request.headers || {}).map(([k, v]) => (
                        <div key={k}>{k}: {v}</div>
                      ))}
                    </div>
                  </div>
                )}

                {result.evidence?.response && (
                  <div className="text-sm">
                    <div className="font-mono text-zinc-400 mb-1">Response:</div>
                    <div className="ml-4 space-y-1 text-zinc-400">
                      <div>Status: {result.evidence.response.status}</div>
                      {Object.entries(result.evidence.response.headers || {}).map(([k, v]) => (
                        <div key={k}>{k}: {v}</div>
                      ))}
                      {result.evidence.response.timings && Object.entries(result.evidence.response.timings).map(([k, v]) => (
                        <div key={k}>{k}: {v}ms</div>
                      ))}
                    </div>
                  </div>
                )}

                {result.evidence?.assertions && (
                  <div className="text-sm">
                    <div className="font-mono text-zinc-400 mb-1">Assertions:</div>
                    <div className="ml-4 space-y-2">
                      {result.evidence.assertions.map((a, i) => (
                        <div key={i} className={`text-sm ${a.pass ? 'text-emerald-400' : 'text-red-400'}`}>
                          <div>{a.pass ? '✓' : '✗'} {a.label}</div>
                          {a.expected && <div className="ml-4 text-xs text-zinc-500">Expected: {a.expected}</div>}
                          {a.actual && <div className="ml-4 text-xs text-zinc-500">Actual: {a.actual}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
