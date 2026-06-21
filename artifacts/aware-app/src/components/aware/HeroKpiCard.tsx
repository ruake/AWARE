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

export const HeroKpiCard = React.memo(function HeroKpiCard({
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
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const deltaIsGood = invertDelta ? displayDelta < 0 : displayDelta > 0;
  const deltaColor =
    displayDelta === 0
      ? "var(--proof-text-muted)"
      : deltaIsGood
        ? "var(--proof-green)"
        : "var(--proof-red)";
  const DeltaIcon = displayDelta > 0 ? TrendingUp : displayDelta < 0 ? TrendingDown : Minus;

  const boxShadow = hovered
    ? `0 0 0 1px ${accentColor}40, 0 8px 32px rgba(0,0,0,0.55), 0 0 48px ${accentColor}12`
    : `0 0 0 1px rgba(99,130,178,0.12), 0 2px 12px rgba(0,0,0,0.4)`;

  const transform = pressed
    ? "translateY(1px) scale(0.978)"
    : hovered
      ? "translateY(-3px) scale(1.01)"
      : "none";

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: `linear-gradient(145deg, var(--proof-surface) 0%, ${accentColor}08 100%)`,
        border: `1px solid ${hovered ? accentColor + "38" : "var(--proof-border)"}`,
        borderRadius: 20,
        padding: "18px 20px 16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 180ms cubic-bezier(0.2,0,0,1)",
        boxShadow,
        transform,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        animation: `card-enter 0.4s cubic-bezier(0.2,0,0,1) ${delay}ms both`,
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
          borderRadius: "20px 20px 0 0",
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 180ms ease",
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
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "opacity 180ms ease",
          opacity: hovered ? 1.4 : 1,
        }}
      />

      {/* Bottom-left subtle wash */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 80,
          height: 60,
          background: `radial-gradient(ellipse at 0% 100%, ${accentColor}10 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Label + icon row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accentColor}28 0%, ${accentColor}14 100%)`,
              border: `1px solid ${accentColor}35`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 0 12px ${accentColor}18`,
            }}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(
                  icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>,
                  { size: 13, style: { color: accentColor } },
                )
              : icon}
          </div>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.7px",
            }}
          >
            {label}
          </span>
        </div>

        {/* Sparkline — top-right */}
        {sparkData.length >= 1 && (
          <SparkLine data={sparkData} color={accentColor} width={64} height={20} />
        )}
      </div>

      {/* Big value */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          position: "relative",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            letterSpacing: "-3px",
            color: accentColor,
            textShadow: `0 0 40px ${accentColor}40`,
            lineHeight: 1,
            transition: "text-shadow 180ms ease",
          }}
        >
          {displayValue}
        </span>
        {value !== undefined && value !== null && suffix && (
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: accentColor,
              opacity: 0.7,
              letterSpacing: "-1px",
              marginBottom: 4,
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
          gap: 6,
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11.5,
            fontWeight: 600,
            color: deltaColor,
            background: `${deltaColor}14`,
            border: `1px solid ${deltaColor}25`,
            borderRadius: 6,
            padding: "2px 7px",
          }}
          aria-label={`${displayDelta > 0 ? "Increased by" : displayDelta < 0 ? "Decreased by" : "No change"} ${Math.abs(displayDelta)}${suffix ? "%" : ""} ${deltaLabel}`}
        >
          <DeltaIcon size={11} aria-hidden="true" />
          {displayDelta > 0 ? "+" : ""}
          {displayDelta}
          {suffix ? "%" : ""}
        </span>
        <span style={{ fontSize: 10.5, color: "var(--proof-text-muted)", fontWeight: 400 }}>
          {deltaLabel}
        </span>
      </div>
    </div>
  );
});
