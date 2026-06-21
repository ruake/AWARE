import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SparkLine } from "./SparkLine";
import { useCountUp } from "@/hooks/useCountUp";

interface HeroKpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  delta: number;
  deltaLabel?: string;
  sparkData: number[];
  accentColor: string;
  icon: React.ReactNode;
  onClick?: () => void;
  invertDelta?: boolean;
  delay?: number;
}

export function HeroKpiCard({
  label,
  value,
  suffix = "",
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
  const _deltaIsBad = invertDelta ? displayDelta > 0 : displayDelta < 0;
  const deltaColor =
    displayDelta === 0
      ? "var(--proof-text-muted)"
      : deltaIsGood
        ? "var(--proof-green)"
        : "var(--proof-red)";
  const DeltaIcon = displayDelta > 0 ? TrendingUp : displayDelta < 0 ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${value ?? "unknown"}${suffix}`}
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
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: "var(--proof-radius-xl)",
        padding: "14px 16px 12px",
        cursor: onClick ? "pointer" : "default",
        transition:
          "border-color var(--proof-transition), box-shadow var(--proof-transition), transform var(--proof-transition)",
        boxShadow: "var(--proof-shadow-card)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        animation: `card-enter 0.35s cubic-bezier(0.2,0,0,1) ${delay}ms both`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = `${accentColor}44`;
        el.style.boxShadow = `var(--proof-shadow-card-hover), 0 0 20px ${accentColor}18`;
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--proof-border)";
        el.style.boxShadow = "var(--proof-shadow-card)";
        el.style.transform = "";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(0.985)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      {/* Radial glow — visible ambient light */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 80% 0%, ${accentColor}30 0%, transparent 55%)`,
          opacity: 0.7,
        }}
      />

      {/* Label + icon */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(
                icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>,
                { size: 12, style: { color: accentColor } },
              )
            : icon}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, position: "relative" }}>
        <span className="proof-hero-number" style={{ fontSize: 44, color: accentColor }}>
          {displayValue}
          {value !== undefined && value !== null && suffix}
        </span>
      </div>

      {/* Delta + sparkline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            fontWeight: 600,
            color: deltaColor,
          }}
          aria-label={`${displayDelta > 0 ? "Increased by" : displayDelta < 0 ? "Decreased by" : "No change"} ${Math.abs(displayDelta)}${suffix ? "%" : ""} ${deltaLabel}`}
        >
          <DeltaIcon size={11} aria-hidden="true" />
          {displayDelta > 0 ? "+" : ""}
          {displayDelta}
          {suffix ? "%" : ""}
          <span style={{ color: "var(--proof-text-muted)", fontWeight: 400, marginLeft: 2 }}>
            {deltaLabel}
          </span>
        </span>
        {sparkData.length >= 2 && (
          <SparkLine data={sparkData} color={accentColor} width={56} height={18} />
        )}
      </div>
    </div>
  );
}
