import { memo, useEffect, useDeferredValue, useMemo, useState } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Globe } from 'lucide-react';
import { loadRuns } from '@/lib/data';
import type { Run } from '@/lib/types';
import { EnvTile } from '@/components/EnvTile';
import { RunRow } from '@/components/RunRow';
import { useSort, sortData, SortHeader } from '@/lib/sortableTable';

const KpiCard = memo(function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: 'sky' | 'rose' | 'emerald' | 'amber';
}) {
  const colors = {
    sky:     { bg: 'bg-gcp-blue/10',     border: 'border-gcp-blue/20',     icon: 'text-gcp-blue',     iconBg: 'bg-gcp-blue/15' },
    rose:    { bg: 'bg-gcp-red/10',    border: 'border-gcp-red/20',    icon: 'text-gcp-red',    iconBg: 'bg-gcp-red/15' },
    emerald: { bg: 'bg-gcp-green/10', border: 'border-gcp-green/20', icon: 'text-gcp-green', iconBg: 'bg-gcp-green/15' },
    amber:   { bg: 'bg-gcp-yellow/10',   border: 'border-gcp-yellow/20',   icon: 'text-gcp-yellow',   iconBg: 'bg-gcp-yellow/15' },
  };
  const c = colors[color];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4 flex items-center gap-4`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.iconBg}`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div>
        <div className="text-2xl font-bold tabular-nums text-gcp-text">{value}</div>
        <div className="text-xs text-gcp-text-muted mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gcp-text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  );
});

export default function Dashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelFilter, setLabelFilter] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');

  useEffect(() => { loadRuns().then(r => { setRuns(r); setLoading(false); }); }, []);

  const deferredRuns = useDeferredValue(runs);

  const byEnv = useMemo(() => ({
    QA:   deferredRuns.filter(r => r.env === 'QA'),
    UAT:  deferredRuns.filter(r => r.env === 'UAT'),
    PROD: deferredRuns.filter(r => r.env === 'PROD'),
  }), [deferredRuns]);

  const kpis = useMemo(() => {
    const totalFailures = deferredRuns.reduce((s, r) => s + r.failures, 0);
    const avgPass = deferredRuns.length ? Math.round(deferredRuns.reduce((s, r) => s + r.passPct, 0) / deferredRuns.length) : 0;
    return { totalRuns: deferredRuns.length, totalFailures, avgPass };
  }, [deferredRuns]);

  const recent = useMemo(() =>
    [...deferredRuns].sort((a, b) => b.started.localeCompare(a.started)).slice(0, 15),
    [deferredRuns]
  );

  const { sort, toggle } = useSort('started', 'desc');
  const sorted = sortData(recent, sort, {
    started: r => new Date(r.started).getTime(),
    label: r => r.label.toLowerCase(),
    env: r => r.env,
    suite: r => r.suiteId,
    passPct: r => r.passPct,
    failures: r => r.failures,
    duration: r => r.duration,
    status: r => r.status,
  });
  const filtered = sorted.filter(r =>
    (!labelFilter || r.label.toLowerCase().includes(labelFilter.toLowerCase())) &&
    (!suiteFilter || r.suiteId.toLowerCase().includes(suiteFilter.toLowerCase())) &&
    (!envFilter || r.env.toLowerCase().includes(envFilter.toLowerCase()))
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-gcp-blue/30 border-t-gcp-blue rounded-full animate-spin" />
        <span className="text-sm text-gcp-text-muted">Loading telemetry…</span>
      </div>
    </div>
  );

  return (
    <div className="px-6 py-6 space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={BarChart3}     label="Total Runs"      value={kpis.totalRuns}    color="sky"     />
        <KpiCard icon={AlertTriangle} label="Total Failures"  value={kpis.totalFailures} color="rose"    sub={kpis.totalFailures > 0 ? 'across all runs' : 'clean run history'} />
        <KpiCard icon={TrendingUp}    label="Avg Pass Rate"   value={`${kpis.avgPass}%`} color="emerald" />
        <KpiCard icon={Globe}         label="Environments"    value={3}                  color="amber"   sub="QA · UAT · PROD" />
      </div>

      {/* Env tiles */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-3">Environment Health</h2>
        <div className="grid grid-cols-3 gap-4">
          <EnvTile env="QA"   runs={byEnv.QA} />
          <EnvTile env="UAT"  runs={byEnv.UAT} />
          <EnvTile env="PROD" runs={byEnv.PROD} />
        </div>
      </div>

      {/* Recent runs */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-3">Recent Runs</h2>
        <div className="rounded-lg border border-gcp-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gcp-surface border-b border-gcp-border">
                <SortHeader label="Run / Label" sortKey="label" currentSort={sort} onToggle={toggle} filterValue={labelFilter} onFilterChange={setLabelFilter} />
                <SortHeader label="Env" sortKey="env" currentSort={sort} onToggle={toggle} filterValue={envFilter} onFilterChange={setEnvFilter} filterPlaceholder="Filter env…" />
                <SortHeader label="Suite" sortKey="suite" currentSort={sort} onToggle={toggle} filterValue={suiteFilter} onFilterChange={setSuiteFilter} />
                <SortHeader label="Pass Rate" sortKey="passPct" currentSort={sort} onToggle={toggle} />
                <SortHeader label="Failures" sortKey="failures" currentSort={sort} onToggle={toggle} />
                <SortHeader label="Duration" sortKey="duration" currentSort={sort} onToggle={toggle} />
                <SortHeader label="When" sortKey="started" currentSort={sort} onToggle={toggle} />
                <SortHeader label="Status" sortKey="status" currentSort={sort} onToggle={toggle} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gcp-border/70">
              {filtered.map(r => <RunRow key={r.id} run={r} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
