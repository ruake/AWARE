import React from "react";
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
      className="glass-panel"
      style={{ position: "relative", display: "flex", cursor: "pointer", flexDirection: "column", gap: 24, borderRadius: 16, border: "1px solid var(--proof-border)", padding: 24, transition: "all 150ms ease-out" }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, height: 160, width: 160, borderRadius: "50%", opacity: 0.1, filter: "blur(64px)", pointerEvents: "none", background: color }} />
      
      <div style={{ zIndex: 10, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.1em", color: "#fff" }}>{group.tier}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 9999, border: `1px solid ${color}40`, padding: "2px 10px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color, background: `${color}15` }}>
              <StatusIcon size={12} /> {group.status}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span className="metric-number" style={{ fontSize: 48, fontWeight: 700, color, textShadow: `0 0 20px ${color}60` }}>{group.avgPassRate}%</span>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-muted)" }}>Pass Rate</span>
        </div>
      </div>

      <div style={{ zIndex: 10, display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--proof-border-light)", paddingTop: 16 }}>
        {group.envs.map(env => {
          const eColor = env.status === "healthy" ? "var(--proof-green)" : env.status === "degraded" ? "var(--proof-yellow)" : "var(--proof-red)";
          return (
            <div key={env.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: "var(--proof-text-secondary)" }}>{env.label.split(" / ")[1] ?? env.label}</span>
              <div style={{ flex: 1, height: 6, overflow: "hidden", borderRadius: 9999, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${env.passRate}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: "100%", borderRadius: 9999, background: eColor, boxShadow: `0 0 8px ${eColor}` }} />
              </div>
              <span className="metric-number" style={{ width: 40, textAlign: "right", fontSize: 12, fontWeight: 700, color: eColor }}>{env.passRate}%</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
