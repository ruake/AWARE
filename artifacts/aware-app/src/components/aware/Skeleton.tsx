import React from "react";
import { motion } from "framer-motion";

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
  className = "",
}: SkeletonBoxProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`proof-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: "var(--proof-surface-3)",
        ...style,
      }}
    />
  );
}

export function SkeletonStat() {
  return (
    <div
      style={{
        width: "100%",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 6,
        background: "var(--proof-surface-2)",
        borderRadius: "var(--proof-radius)",
        border: "1px solid var(--proof-border)",
      }}
    >
      <SkeletonBox width="40%" height={10} />
      <SkeletonBox width="70%" height={24} />
    </div>
  );
}

export function SkeletonBadge() {
  return (
    <SkeletonBox
      width={64}
      height={20}
      borderRadius="var(--proof-radius-full)"
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="proof-card"
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minHeight: height,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <SkeletonBox width="30%" height={14} />
            <SkeletonBadge />
          </div>
          <SkeletonBox width="100%" height={height > 100 ? 40 : 20} />
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
      style={{
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: 16,
          padding: "12px 16px",
          background: "var(--proof-surface-2)",
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} width={`${90 / cols}%`} height={12} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: "flex",
            gap: 16,
            padding: "12px 16px",
            borderBottom: r < rows - 1 ? "1px solid var(--proof-border)" : "none",
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} width={`${90 / cols}%`} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 240 }: { height?: number }) {
  return (
    <div
      className="proof-card"
      style={{
        padding: 20,
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <SkeletonBox width="25%" height={18} />
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonBox width={60} height={18} />
          <SkeletonBox width={60} height={18} />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 12 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBox
            key={i}
            width="100%"
            height={`${Math.max(20, Math.random() * 100)}%`}
            borderRadius="4px 4px 0 0"
          />
        ))}
      </div>
    </div>
  );
}
