import React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface AnomalyBannerProps {
  hasAlert: boolean;
  hasDegradation: boolean;
  regressions: number;
  degradedTiers: string;
  onInvestigate: () => void;
}

export function AnomalyBanner({ hasAlert, hasDegradation, regressions, degradedTiers, onInvestigate }: AnomalyBannerProps) {
  if (!hasAlert && !hasDegradation) return null;

  const isCritical = hasAlert;
  const color = isCritical ? "var(--proof-red)" : "var(--proof-yellow)";
  const bg = isCritical ? "var(--proof-red-bg)" : "var(--proof-yellow-bg)";
  const glow = isCritical ? "var(--proof-glow-red)" : "var(--proof-glow-amber)";
  const message = isCritical ? `${regressions} CRITICAL REGRESSION${regressions !== 1 ? "S" : ""} DETECTED` : `${degradedTiers} DEGRADED`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ 
        width: "100%",
        borderLeft: `4px solid ${color}`,
        borderRadius: "0 12px 12px 0",
        boxShadow: `0 0 20px ${color}20`,
        animation: "pulse-glow 3s infinite ease-in-out"
      }}
    >
      <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", borderRadius: "0 12px 12px 0", border: `1px solid ${color}`, borderLeft: "none", padding: 16, backdropFilter: "blur(12px)", background: bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(0,0,0,0.2)", color }}>
            <AlertCircle style={{ animation: "pulse 2s infinite" }} size={24} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.1em", color, textShadow: `0 0 10px ${color}80` }}>{message}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Immediate attention recommended. System pass rate below threshold.</div>
          </div>
        </div>
        <button onClick={onInvestigate} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "#000", border: "none", cursor: "pointer", background: color, boxShadow: glow }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
          INVESTIGATE <ArrowRight size={16} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}
