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

const ACCENT_COLORS: Record<string, string> = {
  blue: "var(--proof-blue)",
  green: "var(--proof-green)",
  red: "var(--proof-red)",
  yellow: "var(--proof-yellow)",
  purple: "var(--proof-purple)",
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
  const accentColor = accent !== "none" ? ACCENT_COLORS[accent] : undefined;

  return (
    <div
      style={{
        border: "1px solid var(--proof-border)",
        borderRadius: 8,
        background: variant === "inset" ? "var(--proof-grey-bg)" : "var(--proof-surface)",
        overflow: "hidden",
        boxShadow: "var(--proof-shadow-sm)",
        position: "relative",
      }}
    >
      {accent !== "none" && (
        <div
          style={{
            height: 3,
            background: accentColor,
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
            paddingBottom: children ? 0 : padding,
            borderBottom: children ? "1px solid var(--proof-border)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {icon && (
              <div style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }}>{icon}</div>
            )}
            <div style={{ minWidth: 0 }}>
              {title && (
                <div
                  style={{
                    fontSize: 14,
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
                    fontSize: 12,
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
            <SkeletonBox width="60%" height={14} />
            <SkeletonText lines={2} lastLineWidth="80%" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
