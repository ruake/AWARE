import { useEffect, useMemo, useState } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Globe } from 'lucide-react';
import { loadRuns } from '@/lib/data';
import type { Run } from '@/lib/types';
import { EnvTile } from '@/components/EnvTile';
import { RunRow } from '@/components/RunRow';

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: 'sky' | 'rose' | 'emerald' | 'amber';
}) {
  const colors = {
    sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     icon: 'text-sky-400',     iconBg: 'bg-sky-500/15' },
    rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: 'text-rose-400',    iconBg: 'bg-rose-500/15' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', iconBg: 'bg-emerald-500/15' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400',   iconBg: 'bg-amber-500/15' },
  };
  const c = colors[color];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4 flex items-center gap-4`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.iconBg}`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div>
        <div className="text-2xl font-bold tabular-nums text-zinc-100">{value}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRuns().then(r => { setRuns(r); setLoading(false); }); }, []);

  const byEnv = useMemo(() => ({
    QA:   runs.filter(r => r.env === 'QA'),
    UAT:  runs.filter(r => r.env === 'UAT'),
    PROD: runs.filter(r => r.env === 'PROD'),
  }), [runs]);

  const kpis = useMemo(() => {
    const totalFailures = runs.reduce((s, r) => s + r.failures, 0);
    const avgPass = runs.length ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : 0;
    return { totalRuns: runs.length, totalFailures, avgPass };
  }, [runs]);

  const recent = useMemo(() =>
    [...runs].sort((a, b) => b.started.localeCompare(a.started)).slice(0, 15),
    [runs]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Loading telemetry…</span>
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
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Environment Health</h2>
        <div className="grid grid-cols-3 gap-4">
          <EnvTile env="QA"   runs={byEnv.QA} />
          <EnvTile env="UAT"  runs={byEnv.UAT} />
          <EnvTile env="PROD" runs={byEnv.PROD} />
        </div>
      </div>

      {/* Recent runs */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Recent Runs</h2>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 border-b border-zinc-800">
                {['Run / Label', 'Env', 'Suite', 'Pass Rate', 'Failures', 'Duration', 'When', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {recent.map(r => <RunRow key={r.id} run={r} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
