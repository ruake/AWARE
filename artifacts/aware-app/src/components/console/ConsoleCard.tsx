import React from "react";
import { SkeletonBox, SkeletonText } from "@/components/aware/Skeleton";

interface ConsoleCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "inset";
  padding?: string;
  accent?: "blue" | "green" | "red" | "yellow" | "purple" | "none";
  loading?: boolean;
}

const ACCENT_COLORS: Record<string, { main: string; glow: string }> = {
  blue: { main: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  green: { main: "#10b981", glow: "rgba(16,185,129,0.4)" },
  red: { main: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  yellow: { main: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  purple: { main: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
};

export function ConsoleCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  variant = "default",
  padding = "16px",
  accent = "none",
  loading = false,
}: ConsoleCardProps) {
  const hasHeader = title || subtitle || icon || actions;
  const accentCfg = accent !== "none" ? ACCENT_COLORS[accent] : undefined;

  return (
    <div
      style={{
        border: "1px solid var(--proof-border)",
        borderRadius: 12,
        background: variant === "inset" ? "var(--proof-grey-bg)" : "var(--proof-surface)",
        overflow: "hidden",
        position: "relative",
        boxShadow: "var(--proof-shadow-card)",
        transition: "border-color 0.15s",
      }}
    >
      {/* Subtle top gradient highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Accent bar */}
      {accentCfg && (
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${accentCfg.main}, color-mix(in srgb, ${accentCfg.main} 50%, transparent))`,
            boxShadow: `0 0 8px ${accentCfg.glow}`,
            flexShrink: 0,
          }}
        />
      )}

      {hasHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding,
            paddingBottom: children ? "12px" : padding,
            borderBottom: children ? "1px solid var(--proof-border)" : "none",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {icon && (
              <div
                style={{
                  color: accentCfg ? accentCfg.main : "var(--proof-text-secondary)",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              {title && (
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {title}
                </div>
              )}
              {subtitle && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--proof-text-secondary)",
                    lineHeight: 1.3,
                    marginTop: title ? 2 : 0,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {actions && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              {actions}
            </div>
          )}
        </div>
      )}

      <div style={{ padding }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonBox width="55%" height={14} />
            <SkeletonText lines={2} lastLineWidth="75%" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
