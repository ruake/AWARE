import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { motion } from "framer-motion";
import { formatPercent } from "@/lib/i18n";

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
  label,
  value,
  suffix = "",
  delta = 0,
  deltaLabel = "vs prev",
  sparkData = [],
  accentColor = "var(--proof-blue)",
  icon,
  onClick,
  invertDelta = false,
  delay = 0,
}: HeroKpiCardProps) {
  const animatedValue = useCountUp(value, 700, delay);
  const displayValue = value !== undefined && value !== null ? animatedValue : "—";

  const deltaIsGood = invertDelta ? delta < 0 : delta > 0;
  const deltaColor =
    delta === 0
      ? "var(--proof-text-muted)"
      : deltaIsGood
        ? "var(--proof-green)"
        : "var(--proof-red)";
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  // Simple SVG polyline for sparkline
  const renderSparkline = () => {
    if (!sparkData || sparkData.length === 0) return null;
    
    const max = sparkData.length > 0 ? Math.max(...sparkData) : 0;
    const min = sparkData.length > 0 ? Math.min(...sparkData) : 0;
    const range = max - min || 1;
    const width = 80;
    const height = 30;
    
    const points = sparkData.map((val, i) => {
      const x = sparkData.length === 1 ? width / 2 : (i / (sparkData.length - 1)) * width;
      const y = range === 1 || sparkData.length === 1 ? height / 2 : height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity: 0.4 }}>
        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <motion.div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${suffix === "%" ? formatPercent(value) : (value ?? "unknown") + suffix}`}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: "easeOut" }}
      whileHover={{ 
        y: -4,
        scale: 1.01,
        boxShadow: `0 12px 24px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}40, 0 0 20px ${accentColor}20`,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: `linear-gradient(145deg, var(--proof-surface) 0%, ${accentColor}0a 100%)`,
        border: `1px solid var(--proof-border)`,
        borderRadius: "var(--proof-radius-xl)",
        padding: "16px 20px",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "var(--proof-shadow-md)",
      }}
    >
      {/* Top gradient border */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}40 100%)`,
          opacity: 0.8,
        }}
      />

      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1, marginBottom: -4 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {label}
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                letterSpacing: "-0.05em",
                color: "var(--proof-text)",
                lineHeight: 1,
              }}
            >
              {displayValue}
            </span>
            {suffix && (
              <span style={{ fontSize: "1rem", color: "var(--proof-text-secondary)", fontWeight: 700 }}>
                {suffix}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `${accentColor}1a`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
            }}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(
                  icon as React.ReactElement<{ size?: number; strokeWidth?: number }>,
                  { size: 16, strokeWidth: 2.5 }
                )
              : icon}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1, marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: deltaColor,
              background: `${deltaColor}1a`,
              padding: "2px 8px",
              borderRadius: "var(--proof-radius-sm)",
            }}
          >
            <DeltaIcon size={14} strokeWidth={2.5} />
            {delta === 0 ? "—" : (delta > 0 ? "+" : "") + delta + (suffix === "%" ? "%" : "")}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--proof-text-muted)" }}>
            {deltaLabel}
          </span>
        </div>

        <div style={{ marginLeft: "auto" }}>
          {renderSparkline()}
        </div>
      </div>
    </motion.div>
  );
});
