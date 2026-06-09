import { GoogleBarChart, GooglePieChart } from "@/components/aware/GoogleCharts";
import type { TestStats } from "@/lib/types";
import type { ColumnFilterState } from "@/components/aware/ColumnFilter";

const CATEGORY_COLORS = [
  "#5b8af5",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#34d399",
  "#6366f1",
  "#d946ef",
  "#fbbf24",
  "#78716c",
  "#6b7280",
  "#a3e635",
];

export function StatsDashboard({
  stats,
  colFilters,
  onToggleFilter,
}: {
  stats: TestStats;
  colFilters: Record<string, ColumnFilterState>;
  onToggleFilter: (field: string, value: string) => void;
}) {
  const statusData = Object.entries(stats.byStatus).map(([k, v]) => ({
    status: k,
    count: v,
  }));
  const priorityData = Object.entries(stats.byPriority)
    .sort()
    .map(([k, v]) => ({
      priority: k,
      count: v,
    }));
  const categoryData: Record<string, number> = Object.fromEntries(
    Object.entries(stats.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8),
  );
  const catColors = Object.keys(categoryData).map(
    (_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  );

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div
          className="gcp-card"
          style={{ padding: 16, textAlign: "center", cursor: "pointer" }}
          onClick={() => onToggleFilter("_clear", "")}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--proof-blue)" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
            Total Tests
          </div>
        </div>
        <div
          className="gcp-card"
          style={{ padding: 16, textAlign: "center", cursor: "pointer" }}
          onClick={() => onToggleFilter("automated", "true")}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--proof-green)" }}>
            {stats.automated}
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
            Automated
          </div>
        </div>
        <div className="gcp-card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--proof-text)" }}>
            {stats.coverage}%
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
            Category Coverage
          </div>
        </div>
        <div className="gcp-card" style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--proof-text)" }}>
            {stats.avgVersion}
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
            Avg Version
          </div>
        </div>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}
      >
        <div className="gcp-card" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            By Status
          </div>
          <GoogleBarChart
            title=""
            columns={["Status", "Count"]}
            data={statusData}
            xKey="status"
            yKeys={["count"]}
            colors={["#5b8af5"]}
            height="100px"
            showTimeFrame={false}
            onPointClick={(p) => onToggleFilter("status", String(p.status))}
          />
        </div>
        <div className="gcp-card" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            By Priority
          </div>
          <GoogleBarChart
            title=""
            columns={["Priority", "Count"]}
            data={priorityData}
            xKey="priority"
            yKeys={["count"]}
            colors={["#5b8af5"]}
            height="100px"
            showTimeFrame={false}
            onPointClick={(p) => onToggleFilter("priority", String(p.priority))}
          />
        </div>
        <div className="gcp-card" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            By Category
          </div>
          <GooglePieChart title="" data={categoryData} height="140px" colors={catColors} />
        </div>
      </div>
    </>
  );
}
