import React from "react";

export function AboutSection({
  color,
  title,
  badge,
  glow,
  children,
}: {
  color: string;
  title: string;
  badge?: string;
  glow?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 3,
            height: 18,
            borderRadius: 99,
            background: color,
            boxShadow: glow ?? "none",
          }}
        />
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--proof-text)",
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </span>
        {badge && (
          <span
            style={{
              fontSize: 11,
              color: "var(--proof-text-muted)",
              background: "var(--proof-subtle-bg2)",
              border: "1px solid var(--proof-border)",
              borderRadius: 999,
              padding: "1px 8px",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
