import type { ChartOutput, GoogleChartType } from "./langGraphTypes";

export const CHART_COLORS = [
  "#5b8af5",
  "#f59e0b",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

function ensureColors(colors: string[] | undefined, rowCount: number): string[] {
  if (!colors || colors.length === 0) {
    return Array.from({ length: rowCount }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]);
  }
  if (colors.length === 1 && rowCount > 1) {
    return Array.from({ length: rowCount }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]);
  }
  return colors;
}

export function buildTable(
  title: string,
  headers: string[],
  rows: unknown[][],
  options?: Record<string, unknown>,
): ChartOutput {
  return {
    type: "Table",
    title,
    headers,
    rows,
    options: {
      allowHtml: true,
      page: rows.length > 20 ? "enable" : "disable",
      pageSize: rows.length > 20 ? 20 : rows.length,
      sort: "enable",
      ...options,
    },
  };
}

export function buildColumnChart(
  title: string,
  headers: string[],
  rows: unknown[][],
  colors?: string[],
  options?: Record<string, unknown>,
): ChartOutput {
  return {
    type: "ColumnChart",
    title,
    headers,
    rows,
    colors: ensureColors(colors, rows.length),
    options: {
      legend: { position: "none" },
      vAxis: { textStyle: { fontSize: 10 } },
      hAxis: { textStyle: { fontSize: 9 }, slantedText: true, slantedTextAngle: 30 },
      ...options,
    },
  };
}

export function buildBarChart(
  title: string,
  headers: string[],
  rows: unknown[][],
  colors?: string[],
  options?: Record<string, unknown>,
): ChartOutput {
  return {
    type: "BarChart",
    title,
    headers,
    rows,
    colors: ensureColors(colors, rows.length),
    options: {
      legend: { position: "none" },
      hAxis: { textStyle: { fontSize: 10 } },
      vAxis: { textStyle: { fontSize: 9 } },
      ...options,
    },
  };
}

export function buildPieChart(
  title: string,
  headers: string[],
  rows: unknown[][],
  colors?: string[],
  options?: Record<string, unknown>,
): ChartOutput {
  return {
    type: "PieChart",
    title,
    headers,
    rows,
    colors: ensureColors(colors, rows.length),
    options: {
      pieHole: 0.4,
      legend: { position: "right", textStyle: { fontSize: 10 } },
      ...options,
    },
  };
}

export function buildLineChart(
  title: string,
  headers: string[],
  rows: unknown[][],
  colors?: string[],
  options?: Record<string, unknown>,
): ChartOutput {
  const seriesCount = headers.length - 1;
  return {
    type: "LineChart",
    title,
    headers,
    rows,
    colors: ensureColors(colors, seriesCount),
    options: {
      legend: { position: "bottom", textStyle: { fontSize: 10 } },
      curveType: "function",
      pointSize: 4,
      vAxis: { textStyle: { fontSize: 10 } },
      hAxis: { textStyle: { fontSize: 9 } },
      ...options,
    },
  };
}

export function buildAreaChart(
  title: string,
  headers: string[],
  rows: unknown[][],
  colors?: string[],
  options?: Record<string, unknown>,
): ChartOutput {
  const seriesCount = headers.length - 1;
  return {
    type: "AreaChart",
    title,
    headers,
    rows,
    colors: ensureColors(colors, seriesCount),
    options: {
      legend: { position: "bottom", textStyle: { fontSize: 10 } },
      curveType: "function",
      pointSize: 3,
      areaOpacity: 0.08,
      vAxis: { textStyle: { fontSize: 10 } },
      hAxis: { textStyle: { fontSize: 9 } },
      ...options,
    },
  };
}

export function buildSankeyChart(
  title: string,
  headers: string[],
  rows: unknown[][],
  colors?: string[],
  options?: Record<string, unknown>,
): ChartOutput {
  return {
    type: "Sankey",
    title,
    headers,
    rows,
    colors: colors || CHART_COLORS,
    options: {
      sankey: {
        node: { colors: colors || CHART_COLORS, label: { fontSize: 10 } },
        link: { colorMode: "gradient" },
      },
      ...options,
    },
  };
}

export function serializeCharts(charts: ChartOutput[]): string {
  return charts
    .map((c) => {
      const chartJson = JSON.stringify({
        type: c.type,
        title: c.title,
        headers: c.headers,
        rows: c.rows,
        colors: c.colors,
        options: c.options,
      });
      return `\`\`\`chart\n${chartJson}\n\`\`\``;
    })
    .join("\n\n");
}

export function buildChart(
  type: GoogleChartType,
  title: string,
  headers: string[],
  rows: unknown[][],
  colors?: string[],
  options?: Record<string, unknown>,
): ChartOutput {
  switch (type) {
    case "Table":
      return buildTable(title, headers, rows, options);
    case "ColumnChart":
      return buildColumnChart(title, headers, rows, colors, options);
    case "BarChart":
      return buildBarChart(title, headers, rows, colors, options);
    case "PieChart":
      return buildPieChart(title, headers, rows, colors, options);
    case "LineChart":
      return buildLineChart(title, headers, rows, colors, options);
    case "AreaChart":
      return buildAreaChart(title, headers, rows, colors, options);
    case "Sankey":
      return buildSankeyChart(title, headers, rows, colors, options);
    default:
      return buildTable(title, headers, rows, options);
  }
}
