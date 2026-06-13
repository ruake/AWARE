import React from "react";

interface CTAStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
  accentColor?: string;
  icon?: React.ReactNode;
}

export function CTAStatCard({
  label,
  value,
  subtitle,
  onClick,
  active,
  accentColor = "var(--proof-blue)",
  icon,
}: CTAStatCardProps) {
  const [hovered, setHovered] = React.useState(false);

  const isInteractive = !!onClick;
  const isHighlit = active || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => isInteractive && setHovered(true)}
      onMouseLeave={() => isInteractive && setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "14px 16px",
        background: active
          ? `linear-gradient(135deg, ${accentColor}12 0%, transparent 60%)`
          : hovered
            ? "var(--proof-surface-hover)"
            : "var(--proof-surface)",
        border: `1px solid ${isHighlit ? accentColor + "55" : "var(--proof-border)"}`,
        borderTop: `2px solid ${isHighlit ? accentColor : "var(--proof-border-strong)"}`,
        borderRadius: "var(--proof-radius)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        userSelect: "none",
        boxShadow: active ? `0 4px 16px ${accentColor}20` : "none",
      }}
    >
      {/* Label + Icon row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: isHighlit ? accentColor : "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.7px",
            transition: "color 0.15s ease",
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              color: accentColor,
              opacity: isHighlit ? 1 : 0.55,
              transition: "opacity 0.15s ease",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: "var(--proof-text)",
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: 11,
            color: "var(--proof-text-muted)",
            marginTop: 1,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Active indicator bar at bottom */}
      {active && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: accentColor,
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}
