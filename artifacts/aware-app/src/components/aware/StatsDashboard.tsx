import React from "react";
import { ResponsiveContainer, BarChart, Bar, Tooltip, XAxis } from "recharts";

export function StatsDashboard({ stats }: any) {
  return (
    <div className="glass-panel flex flex-col gap-4 rounded-xl border border-[var(--proof-border)] p-6">
      <div className="text-sm font-bold uppercase tracking-widest text-[var(--proof-text-secondary)]">Analytics</div>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={Object.entries(stats?.byCategory || {}).map(([k, v]) => ({ name: k, value: v }))}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "rgba(9, 13, 20, 0.9)", border: "1px solid var(--proof-blue-border)", borderRadius: "8px", color: "white" }} />
            <Bar dataKey="value" fill="var(--proof-blue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
