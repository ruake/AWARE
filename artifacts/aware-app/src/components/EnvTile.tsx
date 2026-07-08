import { memo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Server, FlaskConical, TestTube2 } from 'lucide-react';
import type { Env, Run } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { passRateColor } from '@/lib/envStyles';
import { EASE_OUT, PRESS_SCALE } from '@/lib/motion';
import { relativeTime } from '@/lib/utils';

const ENV_CONFIG = {
  QA:   { icon: FlaskConical, label: 'Quality Assurance', accent: 'border-t-gcp-yellow/60',  iconBg: 'bg-gcp-yellow/10',  iconColor: 'text-gcp-yellow' },
  UAT:  { icon: TestTube2,    label: 'User Acceptance',   accent: 'border-t-gcp-blue/60',     iconBg: 'bg-gcp-blue/10',    iconColor: 'text-gcp-blue' },
  PROD: { icon: Server,       label: 'Production',        accent: 'border-t-gcp-green/60', iconBg: 'bg-gcp-green/10',iconColor: 'text-gcp-green' },
};

export const EnvTile = memo(function EnvTile({ env, runs }: { env: Env; runs: Run[] }) {
  const cfg = ENV_CONFIG[env];
  const Icon = cfg.icon;
  const sorted = [...runs].sort((a, b) => b.started.localeCompare(a.started));
  const latest = sorted[0];
  const avgPass = runs.length ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : null;
  const pc = avgPass !== null ? passRateColor(avgPass) : null;
  const passColor = pc?.text ?? 'text-gcp-text-muted';
  const barColor = pc?.bar ?? 'bg-gcp-border';
  const glow = pc?.glow ?? 'rgba(110,118,135,0.2)';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={PRESS_SCALE}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/runs?env=${env}`}
        className={`group relative block overflow-hidden rounded-xl border border-gcp-border border-t-2 ${cfg.accent} bg-gcp-surface p-5 transition-all duration-200 hover:bg-gcp-elevated/50 hover:backdrop-blur-sm cursor-pointer`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gcp-text-muted">{cfg.label}</div>
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              <span className={passColor} style={avgPass !== null ? { textShadow: `0 0 24px currentColor` } : undefined}>{avgPass !== null ? `${avgPass}%` : 'N/A'}</span>
            </div>
          </div>
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gcp-border-soft ${cfg.iconBg} transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg`}>
            <Icon size={18} className={cfg.iconColor} />
          </div>
        </div>

        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gcp-elevated">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${avgPass ?? 0}%` }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            className={`h-full rounded-full ${barColor}`}
            style={{ boxShadow: `0 0 8px ${glow}` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gcp-text-muted">
            {runs.length} run{runs.length !== 1 ? 's' : ''}
            {latest && <span className="ml-2 text-gcp-text-muted">· {relativeTime(latest.started)}</span>}
          </div>
          {latest && <StatusBadge status={latest.status} size="sm" />}
        </div>
      </Link>
    </motion.div>
  );
});
