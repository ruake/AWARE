import React from "react";

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
  role?: string;
  "aria-busy"?: string | boolean;
  "aria-label"?: string;
  "aria-hidden"?: string | boolean;
}

export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = "var(--proof-radius-md)",
  style,
  className = "",
}: SkeletonBoxProps) {
  return (
    <div
      className={`animate-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonStat() {
  return (
    <div
      className="proof-card"
      role="status"
      aria-busy="true"
      aria-label="Loading..."
      style={{
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <SkeletonBox width="40%" height={14} />
      <SkeletonBox width="70%" height={32} />
    </div>
  );
}

export function SkeletonBadge() {
  return (
    <SkeletonBox
      width={64}
      height={24}
      borderRadius="var(--proof-radius-full)"
      role="status"
      aria-busy="true"
      aria-label="Loading..."
    />
  );
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
}: {
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div 
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
      role="status"
      aria-busy="true"
      aria-label="Loading..."
    >
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          height={14}
          borderRadius="var(--proof-radius-sm)"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  height = 120,
  count = 1,
}: {
  height?: number;
  count?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading..."
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="proof-card"
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            minHeight: height,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SkeletonBox width="40%" height={16} />
            <SkeletonBadge />
          </div>
          <SkeletonBox width="100%" height={height > 100 ? 48 : 24} />
          <SkeletonText lines={2} lastLineWidth="80%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      className="proof-card"
      role="status"
      aria-busy="true"
      aria-label="Loading..."
      style={{
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: 24,
          padding: "16px 24px",
          background: "var(--proof-surface-2)",
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} width={`${90 / cols}%`} height={14} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: "flex",
            gap: 24,
            padding: "16px 24px",
            borderBottom: r < rows - 1 ? "1px solid var(--proof-border-light)" : "none",
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} width={`${90 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div
      className="proof-card"
      role="status"
      aria-busy="true"
      aria-label="Loading..."
      style={{
        padding: 24,
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "30%" }}>
          <SkeletonBox width="100%" height={20} />
          <SkeletonBox width="60%" height={14} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <SkeletonBox width={80} height={28} borderRadius="var(--proof-radius-full)" />
          <SkeletonBox width={80} height={28} borderRadius="var(--proof-radius-full)" />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 16, marginTop: 24 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBox
            key={i}
            width="100%"
            height={`${Math.max(20, Math.random() * 100)}%`}
            borderRadius="var(--proof-radius-sm) var(--proof-radius-sm) 0 0"
          />
        ))}
      </div>
    </div>
  );
}
