import { memo } from 'react';
import { Link } from 'wouter';
import { Server, FlaskConical, TestTube2 } from 'lucide-react';
import type { Env, Run } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

const ENV_CONFIG = {
  QA:   { icon: FlaskConical, label: 'Quality Assurance', accent: 'border-t-gcp-yellow/60',  iconBg: 'bg-gcp-yellow/10',  iconColor: 'text-gcp-yellow' },
  UAT:  { icon: TestTube2,    label: 'User Acceptance',   accent: 'border-t-gcp-blue/60',     iconBg: 'bg-gcp-blue/10',    iconColor: 'text-gcp-blue' },
  PROD: { icon: Server,       label: 'Production',        accent: 'border-t-gcp-green/60', iconBg: 'bg-gcp-green/10',iconColor: 'text-gcp-green' },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export const EnvTile = memo(function EnvTile({ env, runs }: { env: Env; runs: Run[] }) {
  const cfg = ENV_CONFIG[env];
  const Icon = cfg.icon;
  const sorted = [...runs].sort((a, b) => b.started.localeCompare(a.started));
  const latest = sorted[0];
  const avgPass = runs.length ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : null;
  const passColor = avgPass === null ? 'text-gcp-text-muted' : avgPass >= 95 ? 'text-gcp-green' : avgPass >= 80 ? 'text-gcp-yellow' : 'text-gcp-red';
  const barColor = avgPass === null ? 'bg-gcp-border' : avgPass >= 95 ? 'bg-gcp-green' : avgPass >= 80 ? 'bg-gcp-yellow' : 'bg-gcp-red';

  return (
    <Link href={`/runs?env=${env}`}>
      <a className={`block rounded-lg border border-gcp-border border-t-2 ${cfg.accent} bg-gcp-surface p-5 hover:bg-gcp-elevated/60 transition-colors cursor-pointer`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gcp-text-muted mb-1">{cfg.label}</div>
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              <span className={passColor}>{avgPass !== null ? `${avgPass}%` : 'N/A'}</span>
            </div>
          </div>
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${cfg.iconBg} border border-gcp-border-soft`}>
            <Icon size={16} className={cfg.iconColor} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-gcp-elevated mb-4 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${avgPass ?? 0}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gcp-text-muted">
            {runs.length} run{runs.length !== 1 ? 's' : ''}
            {latest && <span className="ml-2 text-gcp-text-muted">· {relativeTime(latest.started)}</span>}
          </div>
          {latest && <StatusBadge status={latest.status} size="sm" />}
        </div>
      </a>
    </Link>
  );
});
