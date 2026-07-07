import { Link } from 'wouter';
import { Server, FlaskConical, TestTube2 } from 'lucide-react';
import type { Env, Run } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

const ENV_CONFIG = {
  QA:   { icon: FlaskConical, label: 'Quality Assurance', accent: 'border-t-amber-500/60',  iconBg: 'bg-amber-500/10',  iconColor: 'text-amber-400' },
  UAT:  { icon: TestTube2,    label: 'User Acceptance',   accent: 'border-t-sky-500/60',     iconBg: 'bg-sky-500/10',    iconColor: 'text-sky-400' },
  PROD: { icon: Server,       label: 'Production',        accent: 'border-t-emerald-500/60', iconBg: 'bg-emerald-500/10',iconColor: 'text-emerald-400' },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function EnvTile({ env, runs }: { env: Env; runs: Run[] }) {
  const cfg = ENV_CONFIG[env];
  const Icon = cfg.icon;
  const sorted = [...runs].sort((a, b) => b.started.localeCompare(a.started));
  const latest = sorted[0];
  const avgPass = runs.length ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : null;
  const passColor = avgPass === null ? 'text-zinc-500' : avgPass >= 95 ? 'text-emerald-400' : avgPass >= 80 ? 'text-amber-400' : 'text-rose-400';
  const barColor = avgPass === null ? 'bg-zinc-700' : avgPass >= 95 ? 'bg-emerald-500' : avgPass >= 80 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <Link href={`/runs?env=${env}`}>
      <a className={`block rounded-lg border border-zinc-800 border-t-2 ${cfg.accent} bg-zinc-900 p-5 hover:bg-zinc-800/60 transition-colors cursor-pointer`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">{cfg.label}</div>
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              <span className={passColor}>{avgPass !== null ? `${avgPass}%` : 'N/A'}</span>
            </div>
          </div>
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${cfg.iconBg} border border-zinc-700/50`}>
            <Icon size={16} className={cfg.iconColor} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-zinc-800 mb-4 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${avgPass ?? 0}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {runs.length} run{runs.length !== 1 ? 's' : ''}
            {latest && <span className="ml-2 text-zinc-600">· {relativeTime(latest.started)}</span>}
          </div>
          {latest && <StatusBadge status={latest.status} size="sm" />}
        </div>
      </a>
    </Link>
  );
}
