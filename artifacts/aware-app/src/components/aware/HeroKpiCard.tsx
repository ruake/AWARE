import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { motion } from "framer-motion";

interface HeroKpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
  deltaLabel?: string;
  sparkData?: number[];
  accentColor?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  invertDelta?: boolean;
  delay?: number;
}

export const HeroKpiCard = React.memo(function HeroKpiCard({
  label, value, suffix = "", delta = 0, deltaLabel = "vs prev", sparkData = [], accentColor = "var(--proof-blue)", icon, onClick, invertDelta = false, delay = 0
}: HeroKpiCardProps) {
  const animatedValue = useCountUp(value, 700, delay);
  const displayValue = value != null ? animatedValue : "—";
  const deltaIsGood = invertDelta ? delta <= 0 : delta >= 0;
  const deltaColor = delta === 0 ? "var(--proof-text-muted)" : deltaIsGood ? "var(--proof-green)" : "var(--proof-red)";
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <motion.div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: delay / 1000 }}
      whileHover={{ y: -2, boxShadow: `0 0 24px ${accentColor}33`, borderColor: `${accentColor}66` }}
      className="glass-panel relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border border-[var(--proof-border)] p-5 transition-all"
      style={{
        background: "rgba(9, 13, 20, 0.6)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="absolute top-0 left-0 h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: accentColor }} />
      
      <div className="flex items-center justify-between z-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--proof-text-secondary)]">{label}</span>
        {icon && <div className="text-[var(--proof-text-secondary)]" style={{ color: accentColor }}>{React.cloneElement(icon as any, { size: 16 })}</div>}
      </div>

      <div className="z-10 flex items-baseline gap-1">
        <span className="metric-number text-5xl font-bold tracking-tighter" style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}40` }}>
          {displayValue}
        </span>
        {suffix && <span className="text-lg font-bold text-[var(--proof-text-secondary)]">{suffix}</span>}
      </div>

      <div className="z-10 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-black/20 px-2 py-0.5 text-xs font-bold" style={{ color: deltaColor, border: `1px solid ${deltaColor}33` }}>
            <DeltaIcon size={12} /> {delta > 0 ? "+" : ""}{delta}{suffix === "%" ? "%" : ""}
          </span>
          <span className="text-xs text-[var(--proof-text-muted)]">{deltaLabel}</span>
        </div>
      </div>
    </motion.div>
  );
});
