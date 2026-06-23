import React from "react";
import { ResponsiveContainer } from "recharts";
import { ConsoleCard } from "./ConsoleCard";
import { SkeletonBox } from "@/components/aware/Skeleton";
import { ChartArea } from "lucide-react";

interface ConsoleChartProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number | string;
  actions?: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

export function ConsoleChart({
  title,
  subtitle,
  children,
  height = 300,
  actions,
  loading = false,
  empty = false,
  emptyMessage = "No data available",
}: ConsoleChartProps) {
  const chartHeight = typeof height === "number" ? height : parseInt(height, 10) || 300;

  return (
    <ConsoleCard title={title} subtitle={subtitle} actions={actions} padding="0">
      <div className="glass-panel" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 16,
          }}
        >
          <SkeletonBox width="30%" height={14} />
          <SkeletonBox width="100%" height={chartHeight - 60} borderRadius={6} />
        </div>
      ) : empty ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: chartHeight,
            padding: 24,
            color: "var(--proof-text-secondary)",
          }}
        >
          <ChartArea
            style={{
              width: 48,
              height: 48,
              color: "var(--proof-text-muted)",
              opacity: 0.2,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)", letterSpacing: "1px", textTransform: "uppercase" }}>
            {emptyMessage}
          </span>
        </div>
      ) : (
        <div style={{ width: "100%", height: chartHeight, padding: 24, paddingTop: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
      </div>
    </ConsoleCard>
  );
}
