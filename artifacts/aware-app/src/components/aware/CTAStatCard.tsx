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
  accentColor = "var(--gcp-blue)",
  icon,
}: CTAStatCardProps) {
  const borderStyle = active
    ? `inset 0 0 0 2px ${accentColor}`
    : `none`;
  const cursor = onClick ? "pointer" : "default";

  return (
    <div
      className="gcp-card"
      onClick={onClick}
      style={{
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderLeft: `4px solid ${accentColor}`,
        cursor,
        boxShadow: borderStyle,
        transition: "box-shadow 0.15s, opacity 0.15s",
        opacity: active ? 1 : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon && (
          <div style={{ color: accentColor, flexShrink: 0, display: "flex" }}>
            {icon}
          </div>
        )}
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--gcp-text-secondary)" }}>
            {label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: accentColor }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
