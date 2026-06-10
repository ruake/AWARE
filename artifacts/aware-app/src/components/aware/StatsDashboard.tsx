import { GoogleBarChart, GooglePieChart } from "@/components/aware/GoogleCharts";
import type { TestStats } from "@/lib/types";
import type { ColumnFilterState } from "@/components/aware/ColumnFilter";
import { CATEGORY_COLORS } from "@/lib/constants";

export function StatsDashboard({
  stats,
  _colFilters,
  onToggleFilter,
}: {
  stats: TestStats;
  _colFilters: Record<string, ColumnFilterState>;
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
          display: "flex",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          className="proof-card"
          style={{ padding: "8px 14px", cursor: "pointer", flex: 1, minWidth: 100 }}
          onClick={() => onToggleFilter("_clear", "")}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-blue)" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Total Tests</div>
        </div>
        <div
          className="proof-card"
          style={{ padding: "8px 14px", cursor: "pointer", flex: 1, minWidth: 100 }}
          onClick={() => onToggleFilter("automated", "true")}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-green)" }}>
            {stats.automated}
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Automated</div>
        </div>
        <div className="proof-card" style={{ padding: "8px 14px", flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-text)" }}>
            {stats.coverage}%
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Coverage</div>
        </div>
        <div className="proof-card" style={{ padding: "8px 14px", flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-text)" }}>
            {stats.avgVersion}
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>Avg Version</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 0 }}>
          <GoogleBarChart
            title="By Status"
            columns={["Status", "Count"]}
            data={statusData}
            xKey="status"
            yKeys={["count"]}
            colors={["#5b8af5"]}
            height="60px"
            showTimeFrame={false}
            onPointClick={(p) => onToggleFilter("status", String(p.status))}
          />
        </div>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 0 }}>
          <GoogleBarChart
            title="By Priority"
            columns={["Priority", "Count"]}
            data={priorityData}
            xKey="priority"
            yKeys={["count"]}
            colors={["#5b8af5"]}
            height="60px"
            showTimeFrame={false}
            onPointClick={(p) => onToggleFilter("priority", String(p.priority))}
          />
        </div>
        <div className="proof-card" style={{ padding: "8px 10px", flex: 1, minWidth: 0 }}>
          <GooglePieChart
            title="By Category"
            data={categoryData}
            height="80px"
            colors={catColors}
          />
        </div>
      </div>
    </>
  );
}
