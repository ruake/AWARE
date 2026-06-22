import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SparkLine } from "./SparkLine";
import { useCountUp } from "@/hooks/useCountUp";
import { motion } from "framer-motion";

interface HeroKpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  subtitle?: string;
  delta: number;
  deltaLabel?: string;
  sparkData: number[];
  accentColor: string;
  icon: React.ReactNode;
  onClick?: () => void;
  invertDelta?: boolean;
  delay?: number;
}

export const HeroKpiCard = React.memo(function HeroKpiCard({
  label,
  value,
  suffix = "",
  subtitle,
  delta,
  deltaLabel = "vs prev",
  sparkData,
  accentColor,
  icon,
  onClick,
  invertDelta = false,
  delay = 0,
}: HeroKpiCardProps) {
  const animatedValue = useCountUp(value, 700, delay);
  const displayValue = value !== undefined && value !== null ? animatedValue : "—";
  const displayDelta = delta !== undefined && delta !== null ? delta : 0;

  const deltaIsGood = invertDelta ? displayDelta < 0 : displayDelta > 0;
  const deltaColor =
    displayDelta === 0
      ? "var(--proof-text-muted)"
      : deltaIsGood
        ? "var(--proof-green)"
        : "var(--proof-red)";
  const DeltaIcon = displayDelta > 0 ? TrendingUp : displayDelta < 0 ? TrendingDown : Minus;

  return (
    <motion.div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${value ?? "unknown"}${suffix}${subtitle ? ` - ${subtitle}` : ""}`}
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
      transition={{ duration: 0.4, delay: delay / 1000, ease: [0.2, 0, 0, 1] }}
      whileHover={{ 
        y: -4,
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: `linear-gradient(145deg, var(--proof-surface) 0%, ${accentColor}08 100%)`,
        border: `1px solid var(--proof-border)`,
        borderRadius: 16,
        padding: "20px",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,130,178,0.12)",
      }}
    >
      {/* Top gradient stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}60 50%, transparent 100%)`,
          borderRadius: "16px 16px 0 0",
          opacity: 0.8,
        }}
      />

      {/* Background radial glow — corner */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Label + icon row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accentColor}24 0%, ${accentColor}10 100%)`,
              border: `1px solid ${accentColor}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 0 12px ${accentColor}14`,
            }}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(
                  icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>,
                  { size: 14, style: { color: accentColor } },
                )
              : icon}
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            {label}
          </span>
        </div>

        {/* Sparkline — top-right */}
        {sparkData.length >= 1 && sparkData.some(v => v !== 0) ? (
          <div style={{ position: 'relative', marginTop: -2 }}>
            <SparkLine data={sparkData} color={accentColor} width={70} height={24} strokeWidth={2} />
          </div>
        ) : sparkData.length >= 1 ? (
          <div style={{ width: 70, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
            <div style={{ width: '100%', height: 1, borderTop: '1px dashed var(--proof-text-muted)' }} />
          </div>
        ) : null}
      </div>

      {/* Big value */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          position: "relative",
          lineHeight: 1,
          marginTop: 4,
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            letterSpacing: "-2.5px",
            color: "var(--proof-text)",
            textShadow: `0 0 30px ${accentColor}30`,
            lineHeight: 1,
          }}
        >
          {displayValue}
        </span>
        {value !== undefined && value !== null && suffix && (
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              opacity: 0.8,
              letterSpacing: "-0.5px",
              marginLeft: 2,
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Delta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          position: "relative",
          marginTop: 2,
          zIndex: 1,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            color: deltaColor,
            background: `${deltaColor}12`,
            border: `1px solid ${deltaColor}20`,
            borderRadius: 99,
            padding: "2px 8px",
            boxShadow: `0 2px 4px rgba(0,0,0,0.1)`,
          }}
          aria-label={`${displayDelta > 0 ? "Increased by" : displayDelta < 0 ? "Decreased by" : "No change"} ${Math.abs(displayDelta)}${suffix ? "%" : ""} ${deltaLabel}`}
        >
          <DeltaIcon size={12} strokeWidth={2.5} aria-hidden="true" />
          {displayDelta > 0 ? "+" : ""}
          {displayDelta}
          {suffix ? "%" : ""}
        </span>
        <span style={{ fontSize: 11, color: "var(--proof-text-muted)", fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {deltaLabel}
        </span>
      </div>
      
      {subtitle && (
        <div
          style={{
            fontSize: 11,
            color: "var(--proof-text-muted)",
            marginTop: 4,
            fontWeight: 400,
            zIndex: 1,
          }}
        >
          {subtitle}
        </div>
      )}
    </motion.div>
  );
});
