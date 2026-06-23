import React from "react";
import { RUNS } from "@/lib/data";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export interface TierEnv { id: string; label: string; passRate: number; trend: number; failures: number; status: "healthy" | "degraded" | "critical"; }
export interface TierGroup { tier: "QA" | "UAT" | "PROD"; envs: TierEnv[]; avgPassRate: number; status: "healthy" | "degraded" | "critical"; }

export function TierCard({ group, onClick, index }: { group: TierGroup; onClick?: () => void; index: number; }) {
  const isHealthy = group.status === "healthy";
  const isDegraded = group.status === "degraded";
  const color = isHealthy ? "var(--proof-green)" : isDegraded ? "var(--proof-yellow)" : "var(--proof-red)";
  const glow = isHealthy ? "var(--proof-glow-green)" : isDegraded ? "var(--proof-glow-amber)" : "var(--proof-glow-red)";
  const StatusIcon = isHealthy ? CheckCircle2 : isDegraded ? AlertTriangle : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, boxShadow: glow, borderColor: color }}
      onClick={onClick}
      className="glass-panel relative flex cursor-pointer flex-col gap-6 rounded-2xl border border-[var(--proof-border)] p-6 transition-all"
    >
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: color }} />
      
      <div className="z-10 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-widest text-white">{group.tier}</span>
            <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider" style={{ borderColor: `${color}40`, color, background: `${color}15` }}>
              <StatusIcon size={12} /> {group.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="metric-number text-5xl font-bold" style={{ color, textShadow: `0 0 20px ${color}60` }}>{group.avgPassRate}%</span>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--proof-text-muted)]">Pass Rate</span>
        </div>
      </div>

      <div className="z-10 flex flex-col gap-3 border-t border-[var(--proof-border-light)] pt-4">
        {group.envs.map(env => {
          const eColor = env.status === "healthy" ? "var(--proof-green)" : env.status === "degraded" ? "var(--proof-yellow)" : "var(--proof-red)";
          return (
            <div key={env.id} className="flex items-center gap-3">
              <span className="w-16 truncate text-xs font-bold text-[var(--proof-text-secondary)]">{env.label.split(" / ")[1] ?? env.label}</span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-black/40 border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${env.passRate}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full rounded-full" style={{ background: eColor, boxShadow: `0 0 8px ${eColor}` }} />
              </div>
              <span className="metric-number w-10 text-right text-xs font-bold" style={{ color: eColor }}>{env.passRate}%</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
