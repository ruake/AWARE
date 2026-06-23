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

export function CTAStatCard({ label, value, subtitle, onClick, active, accentColor = "var(--proof-blue)", icon }: CTAStatCardProps) {
  return (
    <div onClick={onClick} className="glass-panel" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, borderRadius: 12, border: "1px solid var(--proof-border)", padding: 16, transition: "all 150ms ease-out", ...(active ? { transform: "translateY(-4px)" } : {}), borderColor: active ? accentColor : undefined, boxShadow: active ? `0 0 0 1px ${accentColor}` : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-secondary)" }}>{label}</span>
        {icon && <div style={{ color: accentColor }}>{icon}</div>}
      </div>
      <div className="metric-number" style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: "var(--proof-text-muted)" }}>{subtitle}</div>}
    </div>
  );
}
