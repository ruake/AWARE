import React from "react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import type { TestRunPoint } from "@/lib/types";

interface TrendChartProps { passRate: number; flakinessScore: number; avgDuration: number; history: TestRunPoint[]; }

export const TrendChart = React.memo(function TrendChart({ history }: TrendChartProps) {
  const data = history.slice(-20).map(h => ({ pass: "env" in h && typeof (h as any).passRate === "number" ? (h as any).passRate : h.status === "PASS" ? 100 : 0 }));
  return (
    <div className="glass-panel flex h-48 w-full flex-col justify-end overflow-hidden rounded-2xl border border-[var(--proof-border)]">
      <div className="p-4 pb-0 text-sm font-bold uppercase tracking-widest text-[var(--proof-text-secondary)] z-10">Pass Rate Trend</div>
      <div className="flex-1 h-full w-full opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--proof-blue)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--proof-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip contentStyle={{ background: "rgba(9, 13, 20, 0.9)", border: "1px solid var(--proof-blue-border)", borderRadius: "8px", color: "white" }} itemStyle={{ color: "var(--proof-blue)" }} cursor={{ stroke: "var(--proof-blue)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="pass" stroke="var(--proof-blue)" strokeWidth={3} fill="url(#trendGrad)" isAnimationActive={true} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
