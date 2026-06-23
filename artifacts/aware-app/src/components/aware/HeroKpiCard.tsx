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
  label, value, suffix = "", delta = 0, deltaLabel = "vs prev", sparkData: _sparkData = [], accentColor = "var(--proof-blue)", icon, onClick, invertDelta = false, delay = 0
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
      className="glass-panel"
      style={{
        position: "relative",
        display: "flex",
        cursor: onClick ? "pointer" : undefined,
        flexDirection: "column",
        gap: 16,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid var(--proof-border)",
        padding: 20,
        transition: "all 150ms ease-out",
        background: "rgba(9, 13, 20, 0.6)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, height: 4, width: "100%", background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
      <div style={{ position: "absolute", top: -40, right: -40, height: 128, width: 128, borderRadius: "50%", opacity: 0.2, filter: "blur(64px)", pointerEvents: "none", background: accentColor }} />
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-secondary)" }}>{label}</span>
        {icon && <div style={{ color: accentColor }}>{React.cloneElement(icon as React.ReactElement<{size?: number}>, { size: 16 })}</div>}
      </div>

      <div style={{ zIndex: 10, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span className="metric-number" style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", color: accentColor, textShadow: `0 0 20px ${accentColor}40` }}>
          {displayValue}
        </span>
        {suffix && <span style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-text-secondary)" }}>{suffix}</span>}
      </div>

      <div style={{ zIndex: 10, marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 4, background: "rgba(0,0,0,0.2)", padding: "2px 8px", fontSize: 12, fontWeight: 700, color: deltaColor, border: `1px solid ${deltaColor}33` }}>
            <DeltaIcon size={12} /> {delta > 0 ? "+" : ""}{delta}{suffix === "%" ? "%" : ""}
          </span>
          <span style={{ fontSize: 12, color: "var(--proof-text-muted)" }}>{deltaLabel}</span>
        </div>
      </div>
    </motion.div>
  );
});
