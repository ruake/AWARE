import React from "react";
import { RUNS } from "@/lib/data";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export interface TierEnv {
  id: string;
  label: string;
  passRate: number;
  trend: number;
  failures: number;
  status: "healthy" | "degraded" | "critical";
}

export interface TierGroup {
  tier: "QA" | "UAT" | "PROD";
  envs: TierEnv[];
  avgPassRate: number;
  status: "healthy" | "degraded" | "critical";
}

export function statusConfig(status: "healthy" | "degraded" | "critical") {
  if (status === "healthy")
    return {
      color: "var(--proof-green)",
      bright: "var(--proof-green-bright)",
      bg: "var(--proof-green-bg)",
      bgStrong: "var(--proof-green-bg-strong)",
      border: "var(--proof-green-border)",
      glow: "var(--proof-green-glow)",
      label: "Healthy",
      Icon: CheckCircle2,
    };
  if (status === "degraded")
    return {
      color: "var(--proof-yellow)",
      bright: "var(--proof-yellow-bright)",
      bg: "var(--proof-yellow-bg)",
      bgStrong: "var(--proof-yellow-bg-strong)",
      border: "var(--proof-yellow-border)",
      glow: "var(--proof-yellow-glow)",
      label: "Degraded",
      Icon: AlertTriangle,
    };
  return {
    color: "var(--proof-red)",
    bright: "var(--proof-red-bright)",
    bg: "var(--proof-red-bg)",
    bgStrong: "var(--proof-red-bg-strong)",
    border: "var(--proof-red-border)",
    glow: "var(--proof-red-glow)",
    label: "Critical",
    Icon: XCircle,
  };
}

const TIER_META: Record<string, { color: string; label: string }> = {
  QA: { color: "var(--proof-blue)", label: "Quality Assurance" },
  UAT: { color: "var(--proof-purple)", label: "User Acceptance" },
  PROD: { color: "var(--proof-green)", label: "Production" },
};

function TrendArrow({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-[#00dc82]">
        <TrendingUp size={12} /> +{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-[#ff4d6b]">
        <TrendingDown size={12} /> {value}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--proof-text-muted)]">
      <Minus size={12} /> —
    </span>
  );
}

export function TierCard({
  group,
  onClick,
  index,
}: {
  group: TierGroup;
  onClick?: () => void;
  index: number;
}) {
  const cfg = statusConfig(group.status);
  const { Icon } = cfg;
  const meta = TIER_META[group.tier] ?? { color: "var(--proof-blue)", label: group.tier };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative flex flex-col w-full text-left bg-[var(--proof-surface)] border border-[var(--proof-border)] rounded-xl overflow-hidden cursor-pointer shadow-[var(--proof-shadow-sm)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-200"
      onClick={onClick}
      style={{ borderLeft: `3px solid ${cfg.color}`, width: "100%" }}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span 
                className="text-lg font-bold tracking-tight"
                style={{ color: meta.color }}
              >
                {group.tier}
              </span>
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
              >
                <Icon size={12} />
                {cfg.label}
              </span>
            </div>
            <span className="text-xs text-[var(--proof-text-muted)] font-medium">
              {meta.label}
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
            <span 
              className="text-3xl font-black tracking-tighter proof-mono leading-none"
              style={{ color: cfg.color, textShadow: `0 0 16px ${cfg.glow}` }}
            >
              {group.avgPassRate}%
            </span>
            <span className="text-[10px] uppercase font-bold text-[var(--proof-text-muted)] mt-1">
              Avg Pass Rate
            </span>
          </div>
        </div>

        {/* Environments list */}
        <div className="flex flex-col gap-3 mt-2">
          {group.envs.map((env, i) => {
            const envCfg = statusConfig(env.status);
            return (
              <div key={env.id} className="flex items-center gap-3 w-full">
                <div className="flex flex-col gap-1 w-20 flex-shrink-0">
                  <span className="text-xs font-semibold text-[var(--proof-text)] truncate" title={env.label}>
                    {env.label.split(" / ")[1] ?? env.label}
                  </span>
                  <TrendArrow value={env.trend} />
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="w-full h-1.5 bg-[var(--proof-surface-2)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${env.passRate}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 + (index * 0.1) + (i * 0.05) }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: envCfg.color }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 min-w-[50px] justify-end">
                  <span className="text-xs font-bold proof-mono" style={{ color: envCfg.color }}>
                    {env.passRate}%
                  </span>
                  {env.failures > 0 && (
                    <span 
                      className="flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold"
                      style={{ backgroundColor: "var(--proof-red-bg)", color: "var(--proof-red)", border: "1px solid var(--proof-red-border)" }}
                      title={`${env.failures} failures`}
                    >
                      {env.failures}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
