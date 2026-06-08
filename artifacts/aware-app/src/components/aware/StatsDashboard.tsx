import { GoogleBarChart } from "@/components/aware/GoogleCharts";
import type { TestStats } from "@/lib/types";
import type { ColumnFilterState } from "@/components/aware/ColumnFilter";

export function StatsDashboard({ stats, colFilters, onToggleFilter }: {
  stats: TestStats;
  colFilters: Record<string, ColumnFilterState>;
  onToggleFilter: (field: string, value: string) => void;
}) {
  const statusData = Object.entries(stats.byStatus).map(([k, v]) => ({
    status: k, count: v,
  }));
  const priorityData = Object.entries(stats.byPriority).sort().map(([k, v]) => ({
    priority: k, count: v,
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
        <GoogleBarChart
          title=""
          columns={["Status", "Count"]}
          data={statusData}
          xKey="status"
          yKeys={["count"]}
          colors={["#1a73e8"]}
          height="100px"
          showTimeFrame={false}
          onPointClick={p => onToggleFilter("status", String(p.status))}
        />
      </div>
      <div className="gcp-card" style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>By Priority</div>
        <GoogleBarChart
          title=""
          columns={["Priority", "Count"]}
          data={priorityData}
          xKey="priority"
          yKeys={["count"]}
          colors={["#1a73e8"]}
          height="100px"
          showTimeFrame={false}
          onPointClick={p => onToggleFilter("priority", String(p.priority))}
        />
      </div>
    </div>
  );
}
