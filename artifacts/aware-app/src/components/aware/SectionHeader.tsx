import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, actions, children }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--proof-text)" }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 3 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {actions}
        {children}
      </div>
    </div>
  );
}
