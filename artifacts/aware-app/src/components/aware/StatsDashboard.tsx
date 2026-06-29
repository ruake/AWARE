import React from "react";
import { ResponsiveContainer, BarChart, Bar, Tooltip, XAxis } from "recharts";

export function StatsDashboard({ stats }: { stats?: { byCategory?: Record<string, number> } }) {
  return (
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: 16, borderRadius: 12, border: "1px solid var(--proof-border)", padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-secondary)" }}>Analytics</div>
      <div style={{ height: 128, width: "100%" }}>
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
