import type { ChartOutput, GoogleChartType } from "./langGraphTypes";
import { logWarn, logDebug } from "./debugLogger";
import { CHART_COLORS } from "./chartBuilder";

// ── Color Palette ────────────────────────────────────────────────
export const PROOF_COLORS = {
  blue: "#5b8af5",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#a855f7",
  cyan: "#06b6d4",
  pink: "#ec4899",
} as const;

export const STANDARD_PALETTE = Object.values(PROOF_COLORS);

// ── Response Length Limits ───────────────────────────────────────
export const MAX_SENTENCES = 3;
export const MAX_CHART_TITLE_LENGTH = 50;
export const MAX_HEADER_LENGTH = 8;
export const MAX_ROWS = 50;
export const MIN_SENTENCE_LENGTH = 3;

const INTRO_PATTERNS = [
  /^here('s| is) (the |an |my )?(analysis|summary|breakdown|report|look)( of| at| on|:)/i,
  /^based on (the |your |this )?(data|analysis|information|results|runs)/i,
  /^(after|upon|from) (analyzing|reviewing|looking at|examining)/i,
  /^(sure|okay|alright|here you go|let me|i can|i'll|let's)/i,
  /^(as (an |a |per your |requested |asked )|according to)/i,
];

// ── Chart Type Guidelines ────────────────────────────────────────
export const CHART_TYPE_GUIDELINES: Record<GoogleChartType, string> = {
  Table: "Raw data display. Use for showing lists of runs, tests, or configuration details.",
  ColumnChart: "Comparing values across categories. Use for env pass rates, failures by suite, durations by env.",
  BarChart: "Ranking data. Use for top-flaky tests, slowest tests, most-failing tests.",
  PieChart: "Composition / distribution. Use for category breakdown, pass/fail split, env distribution.",
  LineChart: "Time series trends. Use for pass rate over time, failure trend, flakiness trend.",
  AreaChart: "Cumulative or volume trends. Use for total failures over time, total runs accumulated.",
  Gauge: "Single-metric against target. Use for overall pass rate against threshold.",
  Sankey: "Flow or comparison between stages. Use for UAT→PROD promotion flow, env transitions.",
};

export const CHART_TYPE_PREFERENCE: GoogleChartType[] = [
  "LineChart",
  "ColumnChart",
  "BarChart",
  "Table",
  "PieChart",
  "AreaChart",
  "Sankey",
  "Gauge",
];

// ── Chart Block Regex ────────────────────────────────────────────
/**
 * Matches both properly-formatted chart blocks (```chart on its own line)
 * and inline chart blocks (```chart {...}``` mid-text).
 * Group 1: optional preceding text up to the opening fence
 * Group 2: the JSON content between fences
 */
const CHART_FENCE_REGEX = /(?:^|\n)?\s*```chart\s*\n?([\s\S]*?)```/g;

// ── Validation ───────────────────────────────────────────────────
export interface ValidationWarning {
  field: string;
  message: string;
}

export function validateChart(chart: ChartOutput): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (!chart.type) {
    warnings.push({ field: "type", message: "Chart type is required" });
  } else if (!CHART_TYPE_GUIDELINES[chart.type]) {
    warnings.push({ field: "type", message: `Unknown chart type: ${chart.type}` });
  }

  if (!chart.title || chart.title.trim().length === 0) {
    warnings.push({ field: "title", message: "Chart title is required" });
  } else if (chart.title.length > MAX_CHART_TITLE_LENGTH) {
    warnings.push({ field: "title", message: `Title too long (${chart.title.length} > ${MAX_CHART_TITLE_LENGTH})` });
  }

  if (!chart.headers || chart.headers.length === 0) {
    warnings.push({ field: "headers", message: "Headers required" });
  } else {
    for (const h of chart.headers) {
      if (h.length > MAX_HEADER_LENGTH) {
        warnings.push({ field: "headers", message: `Header "${h}" > ${MAX_HEADER_LENGTH} chars` });
      }
    }
  }

  if (!chart.rows || chart.rows.length === 0) {
    warnings.push({ field: "rows", message: "At least one row required" });
  } else if (chart.rows.length > MAX_ROWS) {
    warnings.push({ field: "rows", message: `Too many rows (${chart.rows.length} > ${MAX_ROWS})` });
  }

  if (chart.colors && chart.colors.length > 0 && chart.type !== "Table") {
    const hasStandardColor = chart.colors.some((c) =>
      STANDARD_PALETTE.some((sc) => sc.toLowerCase() === c.toLowerCase()),
    );
    if (!hasStandardColor) {
      warnings.push({ field: "colors", message: "Non-standard color used — stick to PROOF palette" });
    }
  }

  return warnings;
}

export function stripIntroPhrases(text: string): string {
  let cleaned = text.trim();
  for (const pattern of INTRO_PATTERNS) {
    cleaned = cleaned.replace(pattern, "").trim();
  }
  return cleaned;
}

export function countSentences(text: string): number {
  const withoutCode = text.replace(/```[\s\S]*?```/g, "");
  const rawSentences = withoutCode
    .split(/[.!?\n]+/)
    .filter((s) => s.trim().length > MIN_SENTENCE_LENGTH);
  return rawSentences.length;
}

export function truncateSentences(text: string, max: number = MAX_SENTENCES): string {
  const blocks: string[] = [];
  let remaining = text;
  const codeBlocks: string[] = [];
  remaining = remaining.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });

  const parts = remaining.split(/(?<=[.!?])\s+/);
  const kept = parts.slice(0, max);
  let result = kept.join(" ");

  for (let i = 0; i < codeBlocks.length; i++) {
    result = result.replace(`__CODEBLOCK_${i}__`, codeBlocks[i]);
  }

  return result;
}

// ── Extraction ───────────────────────────────────────────────────
/**
 * Extract ALL chart blocks (including malformed ones without newlines).
 * Returns the parsed chart JSON strings and a cleaned text with blocks removed.
 */
function extractAndNormalizeCharts(text: string): {
  charts: string[];
  cleaned: string;
} {
  const found: string[] = [];
  let cleaned = text;

  // First pass: find all occurrences of ```chart...```
  const globalRegex = /```chart\s*\n?([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  const replacements: { start: number; end: number; json: string }[] = [];

  while ((match = globalRegex.exec(cleaned)) !== null) {
    const extracted = extractJson(match[1]);
    if (extracted) {
      found.push(extracted);
    } else {
      logWarn("chart_standards", "Chart block failed JSON parse, dropping");
      found.push(""); // placeholder — will be skipped in rebuild
    }
    replacements.push({ start: match.index, end: match.index + match[0].length, json: found[found.length - 1] });
  }

  // Remove chart blocks from text (replace with nothing — they'll be appended at the end)
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    cleaned = cleaned.slice(0, r.start) + cleaned.slice(r.end);
  }

  return { charts: found, cleaned: cleaned.trim() };
}

/** Find end of valid JSON object/array, correctly handling escaped quotes inside strings */
function findJsonEnd(text: string): number {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") { i++; continue; } // skip escaped char
      if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return text.length;
}

/** Attempt to extract valid JSON from a raw chart block string.
 *  Tries: raw parse → findJsonEnd → try stripping surrounding text */
function extractJson(raw: string): string | null {
  const trimmed = raw.trim();
  // Direct parse
  try { JSON.parse(trimmed); return trimmed; } catch { /* fall through */ }

  // Find the start of a JSON construct
  const startIdx = trimmed.search(/[{[]/);
  if (startIdx === -1) return null;
  const fromStart = trimmed.slice(startIdx);
  const end = findJsonEnd(fromStart);
  const candidate = fromStart.slice(0, end);
  try { JSON.parse(candidate); return candidate; } catch { /* try relaxed */ }

  // Try relaxing: unescape, fix trailing commas
  try {
    const relaxed = candidate
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":')
      .replace(/,(\s*[}\]])/g, "$1");
    JSON.parse(relaxed);
    return relaxed;
  } catch { /* give up */ }

  return null;
}

// ── Main Enforcement ─────────────────────────────────────────────
export function enforceChartStandards(response: string): string {
  let result = response;

  // Strip intro phrases first
  result = stripIntroPhrases(result);

  // Extract all chart blocks, normalize them, clean them from text
  const { charts: rawCharts, cleaned } = extractAndNormalizeCharts(result);

  // Validate and fix each chart
  const validatedCharts: string[] = [];
  for (let i = 0; i < rawCharts.length; i++) {
    const chartStr = rawCharts[i];
    if (!chartStr) continue; // placeholder for dropped
    let chart: ChartOutput;
    try {
      const parsed = JSON.parse(chartStr);
      chart = {
        type: parsed.type,
        title: parsed.title || "",
        headers: parsed.headers || [],
        rows: parsed.rows || [],
        colors: parsed.colors,
        options: parsed.options,
      };
    } catch {
      continue;
    }

    const warnings = validateChart(chart);
    if (warnings.length > 0) {
      logWarn("chart_standards", `Chart #${i + 1} violations`, warnings.map((w) => w.message).join("; "));
      if (chart.title.length > MAX_CHART_TITLE_LENGTH) {
        chart.title = chart.title.slice(0, MAX_CHART_TITLE_LENGTH - 3) + "...";
      }
      if (chart.rows.length > MAX_ROWS) {
        chart.rows = chart.rows.slice(0, MAX_ROWS);
      }
      chart.headers = chart.headers.map((h: string) =>
        h.length > MAX_HEADER_LENGTH ? h.slice(0, MAX_HEADER_LENGTH) : h,
      );
      if (!chart.colors || chart.colors.length === 0) {
        chart.colors = [STANDARD_PALETTE[0]];
      }
    }

    validatedCharts.push(JSON.stringify(chart));
  }

  // Rebuild: cleaned text + properly-formatted chart blocks at the end
  let rebuilt = cleaned;
  if (validatedCharts.length > 0) {
    const chartBlocks = validatedCharts
      .map((json) => "```chart\n" + json + "\n```")
      .join("\n\n");
    rebuilt = rebuilt ? rebuilt + "\n\n" + chartBlocks : chartBlocks;
  }

  // Truncate sentences if needed
  const senCount = countSentences(rebuilt);
  if (senCount > MAX_SENTENCES) {
    logWarn("chart_standards", `Response too long: ${senCount} sentences > ${MAX_SENTENCES}, truncating`);
    rebuilt = truncateSentences(rebuilt);
  }

  return rebuilt;
}

export function enforceChartPresence(
  response: string,
  fallbackChart: () => ChartOutput,
): string {
  const hasChart = /```chart/.test(response);
  if (!hasChart) {
    logWarn("chart_standards", "No chart in response — appending fallback table");
    const chart = fallbackChart();
    const json = JSON.stringify({
      type: chart.type,
      title: chart.title,
      headers: chart.headers,
      rows: chart.rows,
      colors: chart.colors,
      options: chart.options,
    });
    return response + "\n\n```chart\n" + json + "\n```";
  }
  return response;
}

export function populateChartDefaults(chart: Partial<ChartOutput>, index: number): ChartOutput {
  return {
    type: chart.type || "Table",
    title: chart.title || `Chart ${index + 1}`,
    headers: chart.headers || [],
    rows: chart.rows || [],
    colors: chart.colors || [STANDARD_PALETTE[0]],
    options: chart.options || {},
  };
}
