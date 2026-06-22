import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { TrendingUp, Activity, Clock, Percent } from "lucide-react";
import type { TestRunPoint } from "@/lib/types";

interface TrendChartProps {
  passRate: number;
  flakinessScore: number;
  avgDuration: number;
  history: TestRunPoint[];
}

const TOOLTIP_STYLE = {
  background: "var(--proof-surface-3)",
  border: "1px solid var(--proof-border)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--proof-text)",
};

export const TrendChart = React.memo(function TrendChart({
  passRate,
  flakinessScore,
  avgDuration,
  history,
}: TrendChartProps) {
  const sortedHistory = React.useMemo(
    () => [...history].sort((a, b) => (a.runId < b.runId ? -1 : 1)),
    [history],
  );

  const chartData = React.useMemo(() => {
    if (sortedHistory.length === 0) return [];
    let sum = 0;
    return sortedHistory.map((h, i) => {
      const val = h.status === "PASS" ? 100 : 0;
      sum += val;
      const prevVal = i > 0 ? (sortedHistory[i - 1].status === "PASS" ? 100 : 0) : val;
      const isAnomaly = i > 0 && prevVal - val >= 10;

      return {
        label: `#${i + 1}`,
        passRate: val,
        rollingAvg: Math.round(sum / (i + 1)),
        runId: h.runId,
        date: h.date,
        isAnomaly,
      };
    });
  }, [sortedHistory]);

  const anomalies = React.useMemo(
    () => chartData.filter((d) => d.isAnomaly),
    [chartData],
  );

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

  const passRateColor =
    passRate >= 95
      ? "var(--proof-green)"
      : passRate >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)";

  return (
    <div className="proof-card" style={{ overflow: "hidden", borderRadius: "16px" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TrendingUp size={16} style={{ color: "var(--proof-blue)" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
          Pass Rate Trend
        </span>
        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: "auto", fontWeight: 500 }}>
          {chartData.length} {chartData.length === 1 ? "run" : "runs"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 0, flexDirection: "row" }}>
        <div style={{ flex: 1, minWidth: 0, padding: "16px 8px 8px 8px", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPassRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--proof-blue)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--proof-blue)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--proof-text-muted)", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval={chartData.length > 10 ? Math.ceil(chartData.length / 10) : "preserveStartEnd"}
                minTickGap={24}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "var(--proof-text-muted)", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                unit="%"
                width={40}
              />
              <Tooltip
                contentStyle={{...TOOLTIP_STYLE, boxShadow: 'var(--proof-shadow-lg)'}}
                labelStyle={{ color: "var(--proof-text-muted)", fontSize: 10, marginBottom: 4, fontWeight: 600 }}
                cursor={{ stroke: 'var(--proof-border)', strokeWidth: 1 }}
                formatter={(v: number, name: string, entry: any) => {
                  const label = name === "passRate" ? "Pass Rate" : "Rolling Avg";
                  const runInfo = entry.payload.runId ? ` (Run: ${entry.payload.runId})` : '';
                  const dateInfo = entry.payload.date ? ` on ${entry.payload.date}` : '';
                  return [`${v}%`, `${label}${runInfo}${dateInfo}`];
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 20, color: "var(--proof-text-secondary)", fontWeight: 500 }}
                formatter={(value: string) => (value === "passRate" ? "Pass Rate" : "Rolling Avg")}
              />
              <ReferenceArea y1={95} y2={100} fill="var(--proof-green)" fillOpacity={0.05} label={{ position: 'insideRight', value: 'Optimal', fill: 'var(--proof-green)', fontSize: 9, fontWeight: 600, opacity: 0.5 }} />
              <ReferenceArea y1={80} y2={95} fill="var(--proof-yellow)" fillOpacity={0.05} label={{ position: 'insideRight', value: 'Warning', fill: 'var(--proof-yellow)', fontSize: 9, fontWeight: 600, opacity: 0.5 }} />
              <ReferenceArea y1={0} y2={80} fill="var(--proof-red)" fillOpacity={0.05} label={{ position: 'insideRight', value: 'Critical', fill: 'var(--proof-red)', fontSize: 9, fontWeight: 600, opacity: 0.5 }} />
              {anomalies.map((anom, idx) => (
                <ReferenceLine
                  key={idx}
                  x={anom.label}
                  stroke="var(--proof-red)"
                  strokeDasharray="3 3"
                  label={{ value: "⚠", position: "top", fill: "var(--proof-red)", fontSize: 14, fontWeight: 700 }}
                />
              ))}
              <Area
                type="monotone"
                dataKey="passRate"
                stroke="var(--proof-blue)"
                fill="url(#colorPassRate)"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, fill: 'var(--proof-surface)', stroke: 'var(--proof-blue)' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={true}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="rollingAvg"
                stroke="var(--proof-green)"
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={true}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            width: 1,
            background: "var(--proof-border)",
            flexShrink: 0,
            margin: "12px 0",
          }}
        />
        <div
          style={{
            width: 180,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "16px 12px",
            background: "var(--proof-surface-1)",
          }}
        >
          {[
            {
              icon: Percent,
              label: "Pass Rate",
              value: `${Math.round(passRate)}%`,
              color: passRateColor,
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
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                background: "var(--proof-surface-2)",
                border: "1px solid var(--proof-border)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--proof-shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: `color-mix(in srgb, ${color}, transparent 85%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--proof-text-muted)",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-text)",
                    lineHeight: 1.1,
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
