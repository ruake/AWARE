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
  blue: { main: "var(--proof-blue)", glow: "var(--proof-blue-glow)" },
  green: { main: "var(--proof-green)", glow: "rgba(78,201,176,0.4)" },
  red: { main: "var(--proof-red)", glow: "rgba(244,71,71,0.4)" },
  yellow: { main: "var(--proof-yellow)", glow: "rgba(215,186,125,0.4)" },
  purple: { main: "var(--proof-purple)", glow: "rgba(197,134,192,0.4)" },
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
      className="glass-panel"
      style={{
        border: "1px solid var(--proof-border)",
        borderRadius: "var(--proof-radius-lg)",
        background: variant === "inset" ? "var(--proof-surface-2)" : "rgba(9, 13, 20, 0.6)",
        overflow: "hidden",
        position: "relative",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: accentCfg ? accentCfg.glow : "var(--proof-shadow-md)"
      }}
    >
      {/* Accent bar */}
      {accentCfg && (
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${accentCfg.main}, transparent)`,
            boxShadow: `0 0 12px ${accentCfg.main}`,
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
