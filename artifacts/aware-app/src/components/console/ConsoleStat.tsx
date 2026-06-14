import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ConsoleStatProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; direction: "up" | "down" | "neutral"; label?: string };
  icon?: React.ReactNode;
  color?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const VALUE_SIZES: Record<string, number> = {
  sm: 18,
  md: 24,
  lg: 32,
};

const TREND_COLORS: Record<string, string> = {
  up: "var(--proof-green)",
  down: "var(--proof-red)",
  neutral: "var(--proof-yellow)",
};

const TREND_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function ConsoleStat({
  label,
  value,
  unit,
  trend,
  icon,
  color,
  size = "md",
  onClick,
}: ConsoleStatProps) {
  const [hovered, setHovered] = React.useState(false);
  const isInteractive = !!onClick;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => isInteractive && setHovered(true)}
      onMouseLeave={() => isInteractive && setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 14px",
        borderRadius: 6,
        background: hovered ? "var(--proof-surface-hover)" : "transparent",
        cursor: isInteractive ? "pointer" : "default",
        transition: "background var(--proof-transition)",
        userSelect: "none",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              color: color ?? "var(--proof-text-secondary)",
              opacity: 0.6,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: VALUE_SIZES[size],
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: color ?? "var(--proof-text)",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              fontWeight: 500,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
          {(() => {
            const TrendIcon = TREND_ICONS[trend.direction];
            return (
              <TrendIcon
                style={{
                  width: 12,
                  height: 12,
                  color: TREND_COLORS[trend.direction],
                  flexShrink: 0,
                }}
              />
            );
          })()}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: TREND_COLORS[trend.direction],
            }}
          >
            {Math.abs(trend.value).toFixed(1)}%
          </span>
          {trend.label && (
            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-muted)",
                marginLeft: 2,
              }}
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
