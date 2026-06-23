import React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AnomalyBanner({ hasAlert, hasDegradation, regressions, degradedTiers, onInvestigate }: any) {
  if (!hasAlert && !hasDegradation) return null;

  const isCritical = hasAlert;
  const color = isCritical ? "var(--proof-red)" : "var(--proof-yellow)";
  const bg = isCritical ? "var(--proof-red-bg)" : "var(--proof-yellow-bg)";
  const glow = isCritical ? "var(--proof-glow-red)" : "var(--proof-glow-amber)";
  const message = isCritical ? `${regressions} CRITICAL REGRESSION${regressions !== 1 ? "S" : ""} DETECTED` : `${degradedTiers} DEGRADED`;

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="flex w-full items-center justify-between rounded-xl border p-4 shadow-lg backdrop-blur-md" style={{ background: bg, borderColor: color, boxShadow: glow }}>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/20" style={{ color }}>
            <AlertCircle className="animate-pulse" size={24} />
          </div>
          <div>
            <div className="text-lg font-black tracking-widest" style={{ color, textShadow: `0 0 10px ${color}80` }}>{message}</div>
            <div className="text-sm font-bold text-white/70">Immediate attention recommended. System pass rate below threshold.</div>
          </div>
        </div>
        <button onClick={onInvestigate} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95" style={{ background: color, boxShadow: glow }}>
          INVESTIGATE <ArrowRight size={16} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}
