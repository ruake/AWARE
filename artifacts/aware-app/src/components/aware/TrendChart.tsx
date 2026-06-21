import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Activity, Clock, Percent } from "lucide-react";
import type { TestRunPoint } from "@/lib/types";

interface TrendChartProps {
  passRate: number;
  flakinessScore: number;
  avgDuration: number;
  history: TestRunPoint[];
}

export const TrendChart = React.memo(function TrendChart({
  passRate,
  flakinessScore,
  avgDuration,
  history,
}: TrendChartProps) {
  const chartData = React.useMemo(() => {
    if (history.length === 0) return [];
    let sum = 0;
    return history.map((h, i) => {
      const val = h.status === "PASS" ? 100 : 0;
      sum += val;
      return {
        label: `#${i + 1}`,
        passRate: val,
        rollingAvg: Math.round(sum / (i + 1)),
        runId: h.runId,
      };
    });
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="proof-card" style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--proof-text-secondary)", textAlign: "center" }}>
          No trend data available
        </div>
      </div>
    );
  }

  const flakinessColor =
    flakinessScore > 30
      ? "var(--proof-red)"
      : flakinessScore > 15
        ? "var(--proof-yellow)"
        : "var(--proof-green)";

  return (
    <div className="proof-card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--proof-grey)",
          background: "var(--proof-grey-bg)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <TrendingUp size={14} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
          Pass Rate Trend
        </span>
        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: "auto" }}>
          {chartData.length} runs
        </span>
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ flex: 1, minWidth: 0, padding: "8px 4px 4px 0", height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--proof-text-secondary)" }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "var(--proof-text-secondary)" }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--proof-surface)",
                  border: "1px solid var(--proof-border)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v: number, name: string) => [
                  `${v}%`,
                  name === "passRate" ? "Pass Rate" : "Rolling Avg",
                ]}
              />
              <Area
                type="monotone"
                dataKey="passRate"
                stroke="var(--proof-blue)"
                fill="var(--proof-blue)"
                fillOpacity={0.08}
                strokeWidth={1.5}
                dot={chartData.length <= 20}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="rollingAvg"
                stroke="var(--proof-green)"
                fill="none"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            width: 1,
            background: "var(--proof-grey)",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            width: 180,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 12px",
          }}
        >
          {[
            {
              icon: Percent,
              label: "Pass Rate",
              value: `${Math.round(passRate)}%`,
              color: "var(--proof-green)",
            },
            {
              icon: Activity,
              label: "Flakiness",
              value: `${Math.round(flakinessScore)}%`,
              color: flakinessColor,
            },
            {
              icon: Clock,
              label: "Avg Duration",
              value: `${Math.round(avgDuration)}ms`,
              color: "var(--proof-blue)",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px",
                borderRadius: 5,
                background: "var(--proof-grey-bg)",
              }}
            >
              <Icon size={13} style={{ color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color,
                    lineHeight: 1.2,
                  }}
                >
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
