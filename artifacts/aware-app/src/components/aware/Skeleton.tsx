import React from "react";

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonBoxProps) {
  return (
    <div className="proof-skeleton" style={{ width, height, borderRadius, ...style }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .proof-skeleton {
          background: linear-gradient(
            90deg,
            var(--proof-surface-2) 25%,
            var(--proof-surface-3) 50%,
            var(--proof-surface-2) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div
      style={{
        width: 80,
        height: 40,
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
        background: 'var(--proof-surface-2)',
        borderRadius: 'var(--proof-radius)',
        border: '1px solid var(--proof-border)'
      }}
    >
      <SkeletonBox width="100%" height={8} />
      <SkeletonBox width="60%" height={12} />
    </div>
  );
}

export function SkeletonBadge() {
  return <SkeletonBox width={60} height={20} borderRadius="var(--proof-radius-full)" />;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
}: {
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          height={12}
          borderRadius={4}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 120, count = 1 }: { height?: number; count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="proof-card"
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: height,
          }}
        >
          <SkeletonBox width="40%" height={14} />
          <SkeletonBox width="100%" height={height > 80 ? 40 : 20} />
          <SkeletonText lines={2} lastLineWidth="80%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        border: "1px solid var(--proof-grey)",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "10px 12px",
          background: "var(--proof-grey-bg)",
          borderBottom: "1px solid var(--proof-grey)",
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} width={`${80 / cols}%`} height={12} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: "flex",
            gap: 12,
            padding: "10px 12px",
            borderBottom: r < rows - 1 ? "1px solid var(--proof-grey)" : "none",
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} width={`${80 / cols}%`} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="proof-card"
      style={{ padding: 16, minHeight: height, display: "flex", flexDirection: "column", gap: 12 }}
    >
      <SkeletonBox width="30%" height={14} />
      <SkeletonBox width="100%" height={height - 80} borderRadius={6} />
    </div>
  );
}
