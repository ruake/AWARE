import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Chart } from "react-google-charts";
import { Link } from "wouter";

interface MarkdownProps {
  content: string;
  mono?: boolean;
}

// ─── Link auto-detection ──────────────────────────────────────────────────────

const LINK_PATTERNS = [
  { pattern: /\b(run_\w+)\b/g, href: (id: string) => `/runs/${encodeURIComponent(id)}` },
  { pattern: /\b(tr_\w+)\b/g, href: (id: string) => `/runs/${encodeURIComponent(id)}` },
  {
    pattern: /\b(diff_\w+)\b/g,
    href: (id: string) => `/analytics?diffId=${encodeURIComponent(id)}`,
  },
  {
    pattern: /\b([a-z]+_\d+)\b/g,
    href: (id: string) => `/analytics?testId=${encodeURIComponent(id)}`,
  },
];

function linkifyContent(text: string): string {
  const segments: { type: "skip" | "text"; content: string; codeContent?: string }[] = [];
  let lastIndex = 0;
  const skipRe = /```[\s\S]*?```|(`([^`]*)`)|(\[[^\]]*\]\([^)]*\))/g;
  let match: RegExpExecArray | null;
  while ((match = skipRe.exec(text)) !== null) {
    if (match.index > lastIndex)
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    if (match[0].startsWith("```")) {
      segments.push({ type: "skip", content: match[0] });
    } else {
      const backtickContent = match[3];
      segments.push(
        backtickContent
          ? { type: "skip", content: match[0], codeContent: backtickContent }
          : { type: "skip", content: match[0] }
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length)
    segments.push({ type: "text", content: text.slice(lastIndex) });

  function linkifyStr(str: string): string {
    let result = str;
    for (const { pattern, href } of LINK_PATTERNS)
      result = result.replace(pattern, (id: string) => `[${id}](${href(id)})`);
    return result;
  }

  return segments
    .map((seg) => {
      if (seg.type === "skip" && seg.codeContent) {
        const linked = linkifyStr(seg.codeContent);
        if (linked !== seg.codeContent) return linked;
      }
      if (seg.type === "skip") return seg.content;
      return linkifyStr(seg.content);
    })
    .join("");
}

// ─── Table parsing ────────────────────────────────────────────────────────────

type Segment = { type: "text"; raw: string } | { type: "table"; headers: string[]; rows: string[][] };

function splitByTables(content: string): Segment[] {
  const segments: Segment[] = [];
  const lines = content.split("\n");
  let i = 0;
  let textLines: string[] = [];

  while (i < lines.length) {
    if (lines[i].trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const parsed = parseMarkdownTable(tableLines.join("\n"));
      if (parsed) {
        if (textLines.length) {
          segments.push({ type: "text", raw: textLines.join("\n") });
          textLines = [];
        }
        segments.push({ type: "table", ...parsed });
      } else {
        textLines.push(...tableLines);
      }
    } else {
      textLines.push(lines[i]);
      i++;
    }
  }
  if (textLines.length) segments.push({ type: "text", raw: textLines.join("\n") });
  return segments;
}

function parseMarkdownTable(raw: string): { headers: string[]; rows: string[][] } | null {
  const lines = raw
    .trim()
    .split("\n")
    .filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return null;

  // Normalize: ensure trailing pipe so slice(1,-1) always captures last cell
  const parseRow = (line: string) => {
    const t = line.trim();
    const normalized = t.endsWith("|") ? t : t + "|";
    return normalized
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
  };

  const headers = parseRow(lines[0]);
  // Skip separator row (index 1) — lines like |---|---|
  const rows = lines.slice(2).map(parseRow).filter((r) => r.some((c) => c !== ""));
  if (headers.length === 0 || rows.length === 0) return null;
  return { headers, rows };
}

// ─── Color coding ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pass: "#22c55e", passed: "#22c55e", success: "#22c55e", ok: "#22c55e",
  healthy: "#22c55e", stable: "#22c55e", good: "#22c55e",
  fail: "#ef4444", failed: "#ef4444", error: "#ef4444",
  critical: "#ef4444", broken: "#ef4444", down: "#ef4444",
  warning: "#f59e0b", warn: "#f59e0b", flaky: "#f59e0b",
  unstable: "#f59e0b", degraded: "#f59e0b", slow: "#f59e0b", high: "#f59e0b",
  skip: "#9ca3af", skipped: "#9ca3af", pending: "#9ca3af",
  disabled: "#9ca3af", "n/a": "#9ca3af", none: "#9ca3af",
  low: "#22c55e", medium: "#f59e0b",
};

function colorCellHtml(value: string): string {
  const v = value.toLowerCase().trim();
  if (STATUS_COLORS[v]) {
    const c = STATUS_COLORS[v];
    return `<span style="display:inline-flex;align-items:center;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${c}20;color:${c};border:1px solid ${c}40">${value}</span>`;
  }
  if (/^[\d.]+%$/.test(value)) {
    const pct = parseFloat(value);
    const c = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";
    return `<span style="font-weight:700;color:${c}">${value}</span>`;
  }
  return value;
}

// ─── SmartTable (Google Charts Table + filter) ────────────────────────────────

/**
 * Detect whether ALL parseable values in a column are numeric.
 * Used to assign consistent Google Charts column types.
 */
function detectColTypes(headers: string[], rows: string[][]): ("string" | "number")[] {
  return headers.map((_, ci) => {
    const vals = rows.map((r) => (r[ci] ?? "").trim()).filter((v) => v && v !== "—" && v !== "-" && v.toLowerCase() !== "n/a");
    if (vals.length === 0) return "string";
    const allNum = vals.every((v) => /^[\d,]+(\.\d+)?$/.test(v) || /^[\d.]+%$/.test(v));
    return allNum ? "number" : "string";
  });
}

function buildGChartData(
  headers: string[],
  rows: string[][],
  colTypes: ("string" | "number")[]
): unknown[][] {
  // Header row: typed column descriptors
  const headerRow = headers.map((h, i) => ({ label: h, type: colTypes[i] }));

  const dataRows = rows.map((row) =>
    row.map((cell, ci) => {
      const f = colorCellHtml(cell);
      if (colTypes[ci] === "number") {
        const pctMatch = cell.match(/^([\d.]+)%$/);
        if (pctMatch) return { v: parseFloat(pctMatch[1]), f };
        const numMatch = cell.match(/^[\d,]+(\.\d+)?$/);
        if (numMatch) return { v: parseFloat(cell.replace(/,/g, "")), f };
        return { v: null, f }; // null keeps the column type consistent
      }
      return { v: cell, f };
    })
  );

  return [headerRow, ...dataRows];
}

function SmartTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [filter, setFilter] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
  }, [rows, filter]);

  const colTypes = React.useMemo(() => detectColTypes(headers, rows), [headers, rows]);

  const chartData = React.useMemo(
    () => buildGChartData(headers, filteredRows, colTypes),
    [headers, filteredRows, colTypes]
  );

  return (
    <div style={{ margin: "12px 0" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Filter rows…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "4px 10px 4px 28px",
              borderRadius: 6,
              fontSize: 11,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-grey-bg)",
              color: "var(--proof-text)",
              outline: "none",
              width: 160,
            }}
          />
          <svg
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }}
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        {filter && (
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
            {filteredRows.length} / {rows.length} rows
          </span>
        )}
        <span style={{ fontSize: 10, color: "var(--proof-text-muted)", marginLeft: "auto", opacity: 0.55 }}>
          ↕ click header to sort
        </span>
      </div>

      {/* Google Charts Table */}
      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--proof-border)" }}>
        {filteredRows.length > 0 ? (
          <Chart
            chartType="Table"
            data={chartData}
            options={{
              allowHtml: true,
              showRowNumber: false,
              width: "100%",
              alternatingRowStyle: true,
            }}
            width="100%"
            chartPackages={["corechart", "table"]}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "20px", fontSize: 12, color: "var(--proof-text-muted)" }}>
            {filter ? `No rows match "${filter}"` : "No data"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Markdown component map ───────────────────────────────────────────────────

const components = {
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
    const lang = className?.replace(/^language-/, "");
    if (lang === "chart") {
      try {
        const config = JSON.parse(String(children).trim());
        const rows = config.rows || [];
        if (rows.length === 0)
          return (
            <div style={{ padding: 12, fontSize: 11, color: "var(--proof-text-secondary)", textAlign: "center" }}>No data</div>
          );
        const chartType = config.type || "ColumnChart";
        const data = [config.headers || ["X", "Y"], ...rows];
        return (
          <Chart
            chartType={chartType}
            data={data}
            options={{
              title: config.title || "",
              titleTextStyle: { fontSize: 12, color: "#9aa0a6" },
              legend: { position: "bottom", textStyle: { fontSize: 10 } },
              colors: config.colors || ["#5b8af5", "#f59e0b", "#22c55e", "#ef4444", "#a855f7"],
              backgroundColor: "transparent",
              chartArea: { width: "90%", height: "70%" },
              hAxis: { textStyle: { fontSize: 10 } },
              vAxis: { textStyle: { fontSize: 10 } },
              pointSize: config.pointSize || 0,
              curveType: config.curveType || "none",
              isStacked: config.isStacked || false,
              pieHole: config.pieHole || 0,
              ...(config.options || {}),
            }}
            width="100%"
            height={config.height || "200px"}
            chartLanguage="en"
            chartPackages={["corechart", "controls", "table"]}
          />
        );
      } catch {
        // fall through
      }
    }
    const isInline = !className;
    if (isInline) {
      return (
        <code
          style={{
            background: "var(--proof-grey-bg)",
            padding: "1px 5px",
            borderRadius: 3,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--proof-blue)",
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre
        style={{
          background: "var(--proof-grey-bg)",
          padding: 12,
          borderRadius: 6,
          overflowX: "auto",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.5,
          border: "1px solid var(--proof-grey)",
          margin: "8px 0",
        }}
      >
        <code {...props}>{children}</code>
      </pre>
    );
  },
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    const isInternal = !!href && href.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={href!}
          style={{ color: "var(--proof-blue)", textDecoration: "underline", fontWeight: 500 }}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--proof-blue)", textDecoration: "underline", fontWeight: 500 }}
      >
        {children}
      </a>
    );
  },
  table: ({ children }: { children: React.ReactNode }) => (
    <div style={{ overflowX: "auto", margin: "8px 0" }}>
      <table className="proof-table" style={{ fontSize: 11 }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: "4px 10px", textAlign: "left", whiteSpace: "nowrap" }}>{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td style={{ padding: "4px 10px", fontSize: 11 }}>{children}</td>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul style={{ margin: "6px 0 8px", paddingLeft: 18, fontSize: 13, lineHeight: 1.75 }}>{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol style={{ margin: "6px 0 8px", paddingLeft: 18, fontSize: 13, lineHeight: 1.75 }}>{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li style={{ marginBottom: 4, paddingLeft: 2 }}>{children}</li>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p style={{ margin: "0 0 10px", lineHeight: 1.7, fontSize: 13 }}>{children}</p>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong style={{ fontWeight: 700, color: "var(--proof-text)" }}>{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em style={{ color: "var(--proof-text-secondary)", fontStyle: "italic" }}>{children}</em>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 style={{ fontSize: 16, fontWeight: 700, margin: "16px 0 8px", paddingBottom: 6, borderBottom: "2px solid var(--proof-blue)", color: "var(--proof-text)" }}>
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ fontSize: 14, fontWeight: 700, margin: "14px 0 6px", paddingBottom: 4, borderBottom: "1px solid var(--proof-border)", color: "var(--proof-text)" }}>
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 4px", color: "var(--proof-blue)" }}>
      {children}
    </h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 style={{ fontSize: 12, fontWeight: 600, margin: "10px 0 3px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--proof-text-muted)" }}>
      {children}
    </h4>
  ),
  hr: () => (
    <hr style={{ border: "none", borderTop: "1px solid var(--proof-border)", margin: "14px 0" }} />
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote style={{ borderLeft: "3px solid var(--proof-blue)", margin: "10px 0", color: "var(--proof-text-secondary)", background: "var(--proof-grey-bg)", borderRadius: "0 6px 6px 0", padding: "8px 14px" }}>
      {children}
    </blockquote>
  ),
};

// ─── Public export ────────────────────────────────────────────────────────────

export function Markdown({ content, mono = false }: MarkdownProps) {
  const segments = React.useMemo(() => splitByTables(linkifyContent(content)), [content]);

  return (
    <div style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)" }}>
      {segments.map((seg, i) =>
        seg.type === "table" ? (
          <SmartTable key={i} headers={seg.headers} rows={seg.rows} />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={components}>
            {seg.raw}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
