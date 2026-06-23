import React from "react";

export function CTAStatCard({ label, value, subtitle, onClick, active, accentColor = "var(--proof-blue)", icon }: any) {
  return (
    <div onClick={onClick} className={`glass-panel cursor-pointer flex flex-col gap-2 rounded-xl border border-[var(--proof-border)] p-4 transition-all hover:-translate-y-1 ${active ? "ring-1" : ""}`} style={{ borderColor: active ? accentColor : undefined, boxShadow: active ? `0 0 0 1px ${accentColor}` : undefined }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--proof-text-secondary)]">{label}</span>
        {icon && <div style={{ color: accentColor }}>{icon}</div>}
      </div>
      <div className="metric-number text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-[var(--proof-text-muted)]">{subtitle}</div>}
    </div>
  );
}
