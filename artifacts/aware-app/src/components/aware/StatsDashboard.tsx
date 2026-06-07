import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TestStats } from "@/lib/types";
import type { ColumnFilterState } from "@/components/aware/ColumnFilter";

export function StatsDashboard({ stats, colFilters, onToggleFilter }: {
  stats: TestStats;
  colFilters: Record<string, ColumnFilterState>;
  onToggleFilter: (field: string, value: string) => void;
}) {
  const statusData = Object.entries(stats.byStatus).map(([k, v]) => ({
    name: k, value: v,
    color: k === "active" ? "#1e8e3e" : k === "disabled" ? "#f9ab00" : "#d93025",
  }));
  const priorityData = Object.entries(stats.byPriority).sort().map(([k, v]) => ({
    name: k, value: v,
    color: k === "P0" ? "#d93025" : k === "P1" ? "#e8710a" : k === "P2" ? "#1a73e8" : "#5f6368",
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) repeat(2, 2fr)", gap: 14, marginBottom: 16 }}>
      <div className="gcp-card" style={{ padding: 16, textAlign: "center", cursor: "pointer" }} onClick={() => onToggleFilter("_clear", "")}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gcp-blue)" }}>{stats.total}</div>
        <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Total Tests</div>
      </div>
      <div className="gcp-card" style={{ padding: 16, textAlign: "center", cursor: "pointer" }} onClick={() => onToggleFilter("automated", "true")}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gcp-green)" }}>{stats.automated}</div>
        <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Automated</div>
      </div>
      <div className="gcp-card" style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gcp-text)" }}>{stats.coverage}%</div>
        <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Category Coverage</div>
      </div>
      <div className="gcp-card" style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gcp-text)" }}>{stats.avgVersion}</div>
        <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Avg Version</div>
      </div>
      <div className="gcp-card" style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>By Status</div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={statusData} barSize={24} onClick={(data) => data?.activeLabel && onToggleFilter("status", data.activeLabel)}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v: number) => [v, "Count"]} contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" cursor="pointer">
              {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="gcp-card" style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>By Priority</div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={priorityData} barSize={24} onClick={(data) => data?.activeLabel && onToggleFilter("priority", data.activeLabel)}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v: number) => [v, "Count"]} contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" cursor="pointer">
              {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
