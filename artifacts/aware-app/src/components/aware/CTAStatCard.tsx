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

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHovered(true)}
      onMouseLeave={() => onClick && setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "18px 20px 20px",
        background: "var(--proof-surface)",
        border: `1px solid ${active || hovered ? `${accentColor}35` : "var(--proof-border)"}`,
        borderRadius: "var(--proof-radius)",
        boxShadow: hovered
          ? `0 0 0 1px ${accentColor}20, 0 8px 32px rgba(0,0,0,0.4)`
          : active
            ? `0 0 0 2px ${accentColor}25, var(--proof-shadow)`
            : "var(--proof-shadow)",
        cursor: onClick ? "pointer" : "default",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition:
          "transform 0.18s cubic-bezier(0.4,0,0.2,1), box-shadow 0.18s ease, border-color 0.18s ease",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        userSelect: "none",
      }}
    >
      {/* Ambient glow blob */}
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: accentColor,
          opacity: hovered ? 0.1 : 0.055,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
          filter: "blur(12px)",
        }}
      />

      {/* Label + Icon row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.65px",
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: `${accentColor}14`,
              border: `1px solid ${accentColor}22`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
              flexShrink: 0,
              transition: "background 0.18s ease",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "var(--proof-text)",
          letterSpacing: "-1.5px",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--proof-text-secondary)",
            marginTop: 4,
            letterSpacing: "-0.1px",
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Bottom accent bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2.5,
          background: `linear-gradient(90deg, ${accentColor}90 0%, ${accentColor}15 100%)`,
          borderRadius: "0 0 var(--proof-radius) var(--proof-radius)",
          opacity: hovered || active ? 1 : 0.5,
          transition: "opacity 0.2s ease",
        }}
      />
    </div>
  );
}
