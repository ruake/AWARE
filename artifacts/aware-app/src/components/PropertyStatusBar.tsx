import { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Server, Globe } from 'lucide-react';
import { getEnvConfigs } from '@/lib/envConfig';

const TIER_CONFIG = {
  QA:   { icon: Shield, label: 'QA',   bar: 'bg-gcp-yellow',  bg: 'bg-gcp-yellow/8' },
  UAT:  { icon: Globe,  label: 'UAT',  bar: 'bg-gcp-blue',    bg: 'bg-gcp-blue/8' },
  PROD: { icon: Server, label: 'PROD', bar: 'bg-gcp-green',   bg: 'bg-gcp-green/8' },
};

const NET_COLORS: Record<string, string> = {
  staging: 'bg-gcp-text-muted',
  production: 'bg-gcp-blue',
};

const SEGMENT_LABELS: Record<string, string> = {
  staging: 'Staging',
  production: 'Production',
};

export const PropertyStatusBar = memo(function PropertyStatusBar() {
  const configs = getEnvConfigs();
  const tiers = ['QA', 'UAT', 'PROD'] as const;

  return (
    <div className="rounded-xl border border-gcp-border bg-gcp-surface p-4">
      <div className="flex items-center justify-between gap-3">
        {tiers.map((tier, ti) => {
          const cfg = TIER_CONFIG[tier];
          const Icon = cfg.icon;
          const tierConfigs = configs.filter(c => c.target === tier);
          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ti * 0.08, duration: 0.25 }}
              className="flex-1 rounded-lg border border-gcp-border bg-gcp-elevated/40 p-3 hover:bg-gcp-elevated/70 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gcp-elevated border border-gcp-border-soft">
                  <Icon size={12} className="text-gcp-text-secondary" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-gcp-text">{cfg.label}</span>
              </div>
              <div className="flex gap-1.5">
                {tierConfigs.map(ec => {
                  const isActive = ec.active !== false;
                  const netColor = NET_COLORS[ec.network] || 'bg-gcp-text-muted';
                  return (
                    <div
                      key={ec.id}
                      className={`flex-1 rounded px-2 py-1.5 text-[10px] leading-tight border transition-all ${
                        isActive
                          ? 'border-gcp-border-strong bg-gcp-elevated/60'
                          : 'border-gcp-border-soft bg-transparent opacity-50'
                      }`}
                      title={`${ec.label}${!isActive ? ' (inactive)' : ''}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? netColor : 'bg-gcp-text-muted'}`} />
                        <span className="font-medium text-gcp-text-secondary">{SEGMENT_LABELS[ec.network] || ec.network}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {isActive ? (
                          <>
                            <span className="h-1 flex-1 rounded-sm bg-gcp-green/60" />
                            <span className="h-1 flex-1 rounded-sm bg-gcp-elevated" />
                          </>
                        ) : (
                          <span className="h-1 flex-1 rounded-sm bg-gcp-text-muted/30" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
