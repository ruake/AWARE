import { memo, useEffect, useDeferredValue, useMemo, useState } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Globe, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadRuns } from '@/lib/data';
import type { Run } from '@/lib/types';
import { EnvTile } from '@/components/EnvTile';
import { RunRow } from '@/components/RunRow';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageWrapper } from '@/components/PageWrapper';
import { PropertyStatusBar } from '@/components/PropertyStatusBar';
import { useSort, sortData, SortHeader } from '@/lib/sortableTable';
import { staggerContainer, slowStagger, fadeUp, scaleIn } from '@/lib/motion';

const KpiCard = memo(function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: 'sky' | 'rose' | 'emerald' | 'amber';
}) {
  const colors = {
    sky:     { bg: 'bg-gcp-blue/10',     border: 'border-gcp-blue/20',     icon: 'text-gcp-blue',     iconBg: 'bg-gcp-blue/15',   bar: 'bg-gcp-blue',     glow: 'rgba(66,133,244,0.25)',   gradient: 'from-gcp-blue/40 via-gcp-blue to-gcp-blue/40' },
    rose:    { bg: 'bg-gcp-red/10',    border: 'border-gcp-red/20',    icon: 'text-gcp-red',    iconBg: 'bg-gcp-red/15',    bar: 'bg-gcp-red',    glow: 'rgba(234,67,53,0.25)',  gradient: 'from-gcp-red/40 via-gcp-red to-gcp-red/40' },
    emerald: { bg: 'bg-gcp-green/10', border: 'border-gcp-green/20', icon: 'text-gcp-green', iconBg: 'bg-gcp-green/15', bar: 'bg-gcp-green', glow: 'rgba(52,168,83,0.25)', gradient: 'from-gcp-green/40 via-gcp-green to-gcp-green/40' },
    amber:   { bg: 'bg-gcp-yellow/10',   border: 'border-gcp-yellow/20',   icon: 'text-gcp-yellow',   iconBg: 'bg-gcp-yellow/15',   bar: 'bg-gcp-yellow',   glow: 'rgba(251,188,5,0.25)',   gradient: 'from-gcp-yellow/40 via-gcp-yellow to-gcp-yellow/40' },
  };
  const c = colors[color];
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
      className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-start gap-3 relative overflow-hidden`}
      style={{ backdropFilter: 'blur(12px)', boxShadow: `0 0 24px ${c.glow}` }}
    >
      <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${c.gradient} opacity-60`} />
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)` }} />
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.iconBg} shrink-0`}
        style={{ boxShadow: `0 0 16px ${c.glow}` }}
      >
        <Icon size={18} className={c.icon} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold tabular-nums tracking-tight text-gcp-text">{value}</div>
        <div className="text-xs text-gcp-text-muted mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-gcp-text-muted/70 mt-1">{sub}</div>}
      </div>
    </motion.div>
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

  if (loading) return <LoadingSpinner label="Loading telemetry…" />;

  return (
    <PageWrapper className="proof-page space-y-8">
      {/* Property Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PropertyStatusBar />
      </motion.div>

      {/* KPI row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-4 gap-4"
      >
        <motion.div variants={fadeUp}>
          <KpiCard icon={BarChart3}     label="Total Runs"      value={kpis.totalRuns}    color="sky"     sub={deferredRuns.length > 0 ? `${deferredRuns.filter(r => r.env === 'QA').length} QA · ${deferredRuns.filter(r => r.env === 'UAT').length} UAT · ${deferredRuns.filter(r => r.env === 'PROD').length} PROD` : undefined} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard icon={AlertTriangle} label="Total Failures"  value={kpis.totalFailures} color="rose"    sub={kpis.totalFailures > 0 ? 'across all runs' : 'clean run history'} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard icon={TrendingUp}    label="Avg Pass Rate"   value={`${kpis.avgPass}%`} color="emerald" sub="across all environments" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <KpiCard icon={Globe}         label="Environments"    value={3}                  color="amber"   sub="QA · UAT · PROD" />
        </motion.div>
      </motion.div>

      {/* Env tiles */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[2px] w-6 rounded-full bg-gradient-to-r from-gcp-blue/60 to-gcp-blue/10" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-muted">Environment Health</h2>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-gcp-border to-transparent" />
        </div>
        <motion.div
          variants={slowStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4"
        >
          <motion.div variants={scaleIn}>
            <EnvTile env="QA"   runs={byEnv.QA} />
          </motion.div>
          <motion.div variants={scaleIn}>
            <EnvTile env="UAT"  runs={byEnv.UAT} />
          </motion.div>
          <motion.div variants={scaleIn}>
            <EnvTile env="PROD" runs={byEnv.PROD} />
          </motion.div>
        </motion.div>
      </div>

      {/* Recent runs */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[2px] w-6 rounded-full bg-gradient-to-r from-gcp-blue/60 to-gcp-blue/10" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gcp-text-muted">Recent Runs</h2>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-gcp-border to-transparent" />
        </div>
        <div
          className="rounded-xl border border-gcp-border overflow-hidden bg-gcp-surface/50"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gcp-elevated/60 border-b border-gcp-border">
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
            <tbody className="divide-y divide-gcp-border/60 [&>tr:nth-child(even)]:bg-gcp-elevated/15">
              {filtered.map(r => <RunRow key={r.id} run={r} />)}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
