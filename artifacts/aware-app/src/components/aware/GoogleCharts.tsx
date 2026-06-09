import React from "react";
import { Chart } from "react-google-charts";

const GOOGLE_CHARTS_LOADER = {
  packages: ["corechart", "table", "controls"],
  language: "en",
};

export const CHARTS_CONFIG = {
  loader: GOOGLE_CHARTS_LOADER,
};

// ── Google Charts Table with Column Filters ─────────────────────────

export interface FilterableColumn {
  label: string;
  field: string;
  type?: "string" | "number" | "boolean" | "date";
  format?: (val: unknown) => string;
  filterType?: "string" | "select";
  options?: string[];
}

export interface GoogleFilterableTableProps {
  columns: FilterableColumn[];
  rows: Record<string, unknown>[];
  title?: string;
  height?: string;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
  searchPlaceholder?: string;
  options?: Record<string, unknown>;
}

export function GoogleFilterableTable({
  columns, rows, title, height = "400px", pageSize = 25,
  onRowClick, searchPlaceholder = "Search...", options = {},
}: GoogleFilterableTableProps) {
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    return rows.filter(row => {
      // Global search
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const matches = columns.some(col => {
          const val = row[col.field];
          return String(val ?? "").toLowerCase().includes(q);
        });
        if (!matches) return false;
      }
      // Column filters
      for (const col of columns) {
        const filterVal = filters[col.field];
        if (!filterVal) continue;
        const cellVal = String(row[col.field] ?? "").toLowerCase();
        if (!cellVal.includes(filterVal.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, filters, globalSearch, columns]);

  const dataTable = React.useMemo(() => {
    const header = columns.map(c => c.label);
    const body = filteredRows.map(row =>
      columns.map(col => {
        const val = row[col.field];
        return col.format ? col.format(val) : val;
      })
    );
    return [header, ...body];
  }, [columns, filteredRows]);

  const chartOptions = {
    allowHtml: true,
    showRowNumber: true,
    page: "enable",
    pageSize,
    width: "100%" as unknown as number,
    height: height as unknown as number,
    sort: "enable",
    ...options,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gcp-text-secondary)" }}>{title}</div>
      )}
      {/* Filters row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <input
          className="gcp-input"
          style={{ width: 200, fontSize: 11, padding: "4px 8px" }}
          placeholder={searchPlaceholder}
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
        />
        {columns.filter(c => c.filterType === "select" && c.options && c.options.length > 0).map(col => (
          <select
            key={col.field}
            className="gcp-input"
            style={{ fontSize: 11, padding: "4px 8px", width: "auto" }}
            value={filters[col.field] || ""}
            onChange={e => setFilters(f => ({ ...f, [col.field]: e.target.value }))}
          >
            <option value="">{col.label}</option>
            {col.options!.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {Object.keys(filters).some(k => filters[k]) && (
          <button
            onClick={() => setFilters({})}
            style={{ fontSize: 11, color: "var(--gcp-red)", background: "none", border: "none", cursor: "pointer" }}
          >
            Clear filters
          </button>
        )}
      </div>
      {/* Google Chart Table */}
      <Chart
        chartType="Table"
        data={dataTable}
        options={chartOptions}
        chartEvents={
          onRowClick ? [{
            eventName: "select",
            callback: ({ chartWrapper }) => {
              const chart = chartWrapper?.getChart();
              const selection = chart?.getSelection();
              if (selection && selection.length > 0) {
                const rowIdx = selection[0].row;
                if (rowIdx !== undefined && rowIdx !== null && filteredRows[rowIdx]) {
                  onRowClick(filteredRows[rowIdx]);
                }
              }
            },
          }] : undefined
        }
        chartLanguage="en"
        chartPackages={["table", "controls"]}
      />
      <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textAlign: "right" }}>
        Showing {filteredRows.length} of {rows.length} rows
      </div>
    </div>
  );
}

// ── Google Area Chart with Time Frame Selector ─────────────────────

export interface GoogleAreaChartProps {
  title: string;
  columns: string[];
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: string;
  showTimeFrame?: boolean;
  onPointClick?: (point: Record<string, unknown>) => void;
}

export function GoogleAreaChart({
  title, columns, data, xKey, yKeys, colors,
  height = "250px", showTimeFrame = true, onPointClick,
}: GoogleAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState(12);

  const filteredData = React.useMemo(() => {
    if (!showTimeFrame || timeRange >= data.length) return data;
    return data.slice(-timeRange);
  }, [data, timeRange, showTimeFrame]);

  const dataTable = React.useMemo(() => {
    const header = [columns[0], ...yKeys];
    const body = filteredData.map(row => [
      String(row[xKey] ?? ""),
      ...yKeys.map(k => Number(row[k]) || 0),
    ]);
    return [header, ...body];
  }, [columns, filteredData, xKey, yKeys]);

  const chartOptions = {
    title,
    titleTextStyle: { fontSize: 13, color: "#5f6368" },
    legend: { position: "bottom", textStyle: { fontSize: 11 } },
    colors: colors || ["#1a73e8", "#f9ab00", "#1e8e3e", "#9334e6"],
    curveType: "function",
    pointSize: 4,
    focusTarget: "category",
    hAxis: { textStyle: { fontSize: 10 } },
    vAxis: { textStyle: { fontSize: 10 } },
    backgroundColor: "transparent",
    chartArea: { width: "85%", height: "70%" },
    lineWidth: 2,
    areaOpacity: 0.08,
    enableInteractivity: true,
    aggregationTarget: "auto",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {showTimeFrame && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", fontWeight: 600 }}>Time Range:</span>
          {[5, 10, 25, 50, 100].map(n => (
            <button
              key={n}
              onClick={() => setTimeRange(n)}
              style={{
                padding: "2px 10px", fontSize: 10, borderRadius: 4, cursor: "pointer",
                border: `1px solid ${timeRange === n ? "var(--gcp-blue)" : "var(--gcp-grey)"}`,
                background: timeRange === n ? "var(--gcp-blue)" : "transparent",
                color: timeRange === n ? "white" : "var(--gcp-text-secondary)",
                fontWeight: timeRange === n ? 600 : 400,
              }}
            >
              {n === 100 ? "All" : `${n}`}
            </button>
          ))}
        </div>
      )}
      <Chart
        chartType="AreaChart"
        data={dataTable}
        options={chartOptions}
        width="100%"
        height={height}
        chartEvents={
          onPointClick ? [{
            eventName: "select",
            callback: ({ chartWrapper }) => {
              const chart = chartWrapper?.getChart();
              const selection = chart?.getSelection();
              if (selection && selection.length > 0) {
                const rowIdx = selection[0].row;
                if (rowIdx !== undefined && rowIdx !== null && filteredData[rowIdx]) {
                  onPointClick(filteredData[rowIdx]);
                }
              }
            },
          }] : undefined
        }
        chartLanguage="en"
        chartPackages={["corechart", "controls"]}
      />
    </div>
  );
}

// ── Google Bar Chart with Time Frame Selector ──────────────────────

export interface GoogleBarChartProps {
  title: string;
  columns: string[];
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: string;
  showTimeFrame?: boolean;
  barType?: "grouped" | "stacked";
  isHorizontal?: boolean;
  onPointClick?: (point: Record<string, unknown>) => void;
}

export function GoogleBarChart({
  title, columns, data, xKey, yKeys, colors,
  height = "250px", showTimeFrame = true,
  barType = "grouped", isHorizontal = false,
  onPointClick,
}: GoogleBarChartProps) {
  const [timeRange, setTimeRange] = React.useState(10);

  const filteredData = React.useMemo(() => {
    if (!showTimeFrame || timeRange >= data.length) return data;
    return data.slice(-timeRange);
  }, [data, timeRange, showTimeFrame]);

  const dataTable = React.useMemo(() => {
    const header = [columns[0], ...yKeys];
    const body = filteredData.map(row => [
      String(row[xKey] ?? ""),
      ...yKeys.map(k => Number(row[k]) || 0),
    ]);
    return [header, ...body];
  }, [columns, filteredData, xKey, yKeys]);

  const chartType = isHorizontal ? "BarChart" : "ColumnChart";

  const chartOptions = {
    title,
    titleTextStyle: { fontSize: 13, color: "#5f6368" },
    legend: { position: "bottom", textStyle: { fontSize: 11 } },
    colors: colors || ["#1a73e8", "#f9ab00", "#1e8e3e", "#9334e6"],
    isStacked: barType === "stacked",
    focusTarget: "category",
    hAxis: { textStyle: { fontSize: 10 } },
    vAxis: { textStyle: { fontSize: 10 } },
    backgroundColor: "transparent",
    chartArea: { width: "85%", height: "70%" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {showTimeFrame && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", fontWeight: 600 }}>Time Range:</span>
          {[5, 10, 20, 50, 100].map(n => (
            <button
              key={n}
              onClick={() => setTimeRange(n)}
              style={{
                padding: "2px 10px", fontSize: 10, borderRadius: 4, cursor: "pointer",
                border: `1px solid ${timeRange === n ? "var(--gcp-blue)" : "var(--gcp-grey)"}`,
                background: timeRange === n ? "var(--gcp-blue)" : "transparent",
                color: timeRange === n ? "white" : "var(--gcp-text-secondary)",
                fontWeight: timeRange === n ? 600 : 400,
              }}
            >
              {n === 100 ? "All" : `${n}`}
            </button>
          ))}
        </div>
      )}
      <Chart
        chartType={chartType}
        data={dataTable}
        options={chartOptions}
        width="100%"
        height={height}
        chartEvents={
          onPointClick ? [{
            eventName: "select",
            callback: ({ chartWrapper }) => {
              const chart = chartWrapper?.getChart();
              const selection = chart?.getSelection();
              if (selection && selection.length > 0) {
                const rowIdx = selection[0].row;
                if (rowIdx !== undefined && rowIdx !== null && filteredData[rowIdx]) {
                  onPointClick(filteredData[rowIdx]);
                }
              }
            },
          }] : undefined
        }
        chartLanguage="en"
        chartPackages={["corechart", "controls"]}
      />
    </div>
  );
}

// ── Google Pie / Donut Chart ───────────────────────────────────────

export interface GooglePieChartProps {
  title: string;
  data: Record<string, number>;
  height?: string;
  isDonut?: boolean;
  colors?: string[];
}

export function GooglePieChart({ title, data, height = "200px", isDonut = false, colors }: GooglePieChartProps) {
  const dataTable = React.useMemo(() => {
    const header = ["Key", "Value"];
    const body = Object.entries(data).map(([k, v]) => [k, v]);
    return [header, ...body];
  }, [data]);

  return (
    <Chart
      chartType="PieChart"
      data={dataTable}
      options={{
        title,
        titleTextStyle: { fontSize: 13, color: "#5f6368" },
        pieHole: isDonut ? 0.4 : 0,
        colors: colors || ["#1a73e8", "#f9ab00", "#1e8e3e", "#d93025", "#9334e6"],
        legend: { position: "right", textStyle: { fontSize: 10 } },
        backgroundColor: "transparent",
        chartArea: { width: "90%", height: "80%" },
      }}
      width="100%"
      height={height}
      chartLanguage="en"
      chartPackages={["corechart"]}
    />
  );
}

// ── Google Gauge Chart ─────────────────────────────────────────────

export interface GoogleGaugeProps {
  value: number;
  max?: number;
  min?: number;
  label: string;
  greenFrom?: number;
  greenTo?: number;
  yellowFrom?: number;
  yellowTo?: number;
  redFrom?: number;
  redTo?: number;
  height?: string;
}

export function GoogleGauge({
  value, max = 100, min = 0, label,
  greenFrom = 80, greenTo = 100,
  yellowFrom = 50, yellowTo = 80,
  redFrom = 0, redTo = 50,
  height = "120px",
}: GoogleGaugeProps) {
  return (
    <Chart
      chartType="Gauge"
      data={[
        ["Label", "Value"],
        [label, value],
      ]}
      options={{
        min,
        max,
        greenFrom,
        greenTo,
        yellowFrom,
        yellowTo,
        redFrom,
        redTo,
        majorTicks: ["0", "25", "50", "75", "100"],
        minorTicks: 5,
        width: "100%" as unknown as number,
        height: height as unknown as number,
      }}
      chartLanguage="en"
      chartPackages={["gauge"]}
    />
  );
}
