import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "wouter";
import { MarkdownCode, STATUS_COLORS } from "./MarkdownCode";

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
    href: (id: string) => `/trends?diffId=${encodeURIComponent(id)}`,
  },
  {
    pattern: /\b([a-z]+_\d+)\b/g,
    href: (id: string) => `/trends?testId=${encodeURIComponent(id)}`,
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
          : { type: "skip", content: match[0] },
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", content: text.slice(lastIndex) });

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

// ─── Multi-column layout ──────────────────────────────────────────────────────

/** Walk forward from `startIdx` to find the matching closing ``` for a fenced block,
 *  correctly tracking nested ```fence blocks (```chart, ```columns, etc.) */
function findMatchingClose(content: string, startIdx: number): number {
  let depth = 0;
  let pos = startIdx;
  while (true) {
    const fenceIdx = content.indexOf("```", pos);
    if (fenceIdx === -1) return -1;
    const after = fenceIdx + 3;
    if (after >= content.length || content[after] === "\n" || content[after] === "\r") {
      if (depth === 0) return fenceIdx;
      depth--;
      pos = after;
    } else {
      depth++;
      const nlIdx = content.indexOf("\n", after);
      if (nlIdx === -1) return -1;
      pos = nlIdx + 1;
    }
  }
}

/** Strip single-column ```columns...``` wrappers (passthrough inner content) */
function unwrapSingleColumns(content: string): string {
  const startMatch = content.match(/```columns\s*\n/);
  if (!startMatch) return content;
  const startIdx = startMatch.index!;
  const closeIdx = findMatchingClose(content, startIdx + startMatch[0].length);
  if (closeIdx === -1) return content;
  const inner = content.slice(startIdx + startMatch[0].length, closeIdx).trim();
  const cols = inner
    .split(/\n---+\n/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (cols.length >= 2) return content;
  return content.slice(0, startIdx) + inner + content.slice(closeIdx + 3);
}

/** Parse ```columns ... ``` blocks into column groups (only multi-column) */
function splitByColumns(
  content: string,
): { before: string; columns: string[]; after: string } | null {
  const startMatch = content.match(/```columns\s*\n/);
  if (!startMatch) return null;
  const startIdx = startMatch.index!;
  const closeIdx = findMatchingClose(content, startIdx + startMatch[0].length);
  if (closeIdx === -1) return null;
  const inner = content.slice(startIdx + startMatch[0].length, closeIdx).trim();
  const cols = inner
    .split(/\n---+\n/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (cols.length < 2) return null;
  return {
    before: content.slice(0, startIdx),
    columns: cols,
    after: content.slice(closeIdx + 3),
  };
}

function Columns({ children }: { children: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(children.length, 3)}, 1fr)`,
        gap: 14,
        margin: "10px 0",
      }}
    >
      {children.map((col, i) => (
        <div
          key={i}
          style={{
            minWidth: 0,
            overflow: "hidden",
            background: "var(--proof-surface)",
            borderRadius: 8,
            border: "1px solid var(--proof-border)",
            padding: 12,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {badgeifyContent(col)}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}

// ─── Table parsing ────────────────────────────────────────────────────────────

type Segment =
  | { type: "text"; raw: string }
  | { type: "table"; headers: string[]; rows: string[][] };

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
  const rows = lines
    .slice(2)
    .map(parseRow)
    .filter((r) => r.some((c) => c !== ""));
  if (headers.length === 0 || rows.length === 0) return null;
  return { headers, rows };
}

// ─── Color coding ─────────────────────────────────────────────────────────────

/** Convert bare status words in text into backtick-wrapped inline code.
 *  Runs only on non-table segments so SmartTable stays clean. */
const STATUS_WORD_PATTERN = new RegExp(`\\b(${Object.keys(STATUS_COLORS).join("|")})\\b`, "gi");

function badgeifyContent(text: string): string {
  // Skip text inside code blocks or already-wrapped backticks
  const segments: { type: "skip" | "text"; content: string }[] = [];
  let lastIdx = 0;
  const skipRe = /```[\s\S]*?```|`[^`]*`/g;
  let m: RegExpExecArray | null;
  while ((m = skipRe.exec(text)) !== null) {
    if (m.index > lastIdx) segments.push({ type: "text", content: text.slice(lastIdx, m.index) });
    segments.push({ type: "skip", content: m[0] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) segments.push({ type: "text", content: text.slice(lastIdx) });
  return segments
    .map((s) => (s.type === "skip" ? s.content : s.content.replace(STATUS_WORD_PATTERN, "`$1`")))
    .join("");
}

function ColorCell({ value }: { value: string }) {
  const v = value.toLowerCase().trim();
  if (STATUS_COLORS[v]) {
    const c = STATUS_COLORS[v] as string;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "1px 8px",
          borderRadius: "10px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.35px",
          background: `color-mix(in srgb, ${c} 10%, transparent)`,
          color: c,
          border: `1px solid color-mix(in srgb, ${c} 20%, transparent)`,
        }}
      >
        {value}
      </span>
    );
  }
  if (/^[\d.]+%$/.test(value)) {
    const pct = parseFloat(value);
    const c =
      pct >= 90 ? "var(--proof-green)" : pct >= 70 ? "var(--proof-yellow)" : "var(--proof-red)";
    return <span style={{ fontWeight: 700, color: c }}>{value}</span>;
  }
  return <>{value}</>;
}

// ── SmartTable (HTML table with filter + sort) ───────────────────────────────────────

function SmartTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const [filter, setFilter] = React.useState("");
  const [sortCol, setSortCol] = React.useState<number | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);

  const filteredRows = React.useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
  }, [rows, filter]);

  const sortedRows = React.useMemo(() => {
    if (sortCol === null) return filteredRows;
    const sorted = [...filteredRows].sort((a, b) => {
      const aVal = (a[sortCol] ?? "").toLowerCase();
      const bVal = (b[sortCol] ?? "").toLowerCase();
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortAsc ? aNum - bNum : bNum - aNum;
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRows, sortCol, sortAsc]);

  function toggleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortAsc((prev) => !prev);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  }

  return (
    <div style={{ margin: "12px 0" }}>
      {/* Toolbar */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}
      >
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
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.4,
              pointerEvents: "none",
            }}
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        {filter && (
          <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
            {sortedRows.length} / {rows.length} rows
          </span>
        )}
        <span
          style={{
            fontSize: 10,
            color: "var(--proof-text-muted)",
            marginLeft: "auto",
            opacity: 0.55,
          }}
        >
          ↕ click header to sort
        </span>
      </div>

      {/* HTML Table */}
      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--proof-border)" }}>
        {sortedRows.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "var(--proof-grey-bg)", fontWeight: 600 }}>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    onClick={() => toggleSort(i)}
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid var(--proof-border)",
                      color: "var(--proof-text)",
                      userSelect: "none",
                    }}
                  >
                    {h}
                    {sortCol === i ? (sortAsc ? " \u25B2" : " \u25BC") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    background: ri % 2 === 0 ? "transparent" : "var(--proof-grey-bg)",
                  }}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: "4px 10px",
                        borderBottom: "1px solid var(--proof-border)",
                        color: "var(--proof-text)",
                      }}
                    >
                      <ColorCell value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              fontSize: 12,
              color: "var(--proof-text-muted)",
            }}
          >
            {filter ? `No rows match "${filter}"` : "No data"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Markdown component map ───────────────────────────────────────────────────

const components = {
  code: MarkdownCode,
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
    <ul style={{ margin: "6px 0 8px", paddingLeft: 18, fontSize: 13, lineHeight: 1.75 }}>
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol style={{ margin: "6px 0 8px", paddingLeft: 18, fontSize: 13, lineHeight: 1.75 }}>
      {children}
    </ol>
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
    <h1
      style={{
        fontSize: 16,
        fontWeight: 700,
        margin: "16px 0 8px",
        paddingBottom: 6,
        borderBottom: "2px solid var(--proof-blue)",
        color: "var(--proof-text)",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2
      style={{
        fontSize: 14,
        fontWeight: 700,
        margin: "14px 0 6px",
        paddingBottom: 4,
        borderBottom: "1px solid var(--proof-border)",
        color: "var(--proof-text)",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 style={{ fontSize: 13, fontWeight: 600, margin: "12px 0 4px", color: "var(--proof-blue)" }}>
      {children}
    </h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4
      style={{
        fontSize: 12,
        fontWeight: 600,
        margin: "10px 0 3px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--proof-text-muted)",
      }}
    >
      {children}
    </h4>
  ),
  hr: () => (
    <hr style={{ border: "none", borderTop: "1px solid var(--proof-border)", margin: "14px 0" }} />
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote
      style={{
        borderLeft: "3px solid var(--proof-blue)",
        margin: "10px 0",
        color: "var(--proof-text-secondary)",
        background: "var(--proof-grey-bg)",
        borderRadius: "0 6px 6px 0",
        padding: "8px 14px",
      }}
    >
      {children}
    </blockquote>
  ),
};

// ─── Public export ────────────────────────────────────────────────────────────

export function Markdown({ content, mono = false }: MarkdownProps) {
  const linked = React.useMemo(() => linkifyContent(content), [content]);

  const rendered = React.useMemo(() => {
    const cleaned = unwrapSingleColumns(linked);
    const cols = splitByColumns(cleaned);
    if (cols) {
      const segments = splitByTables(cols.before + cols.after);
      return { columns: cols.columns, segments };
    }
    return { columns: null, segments: splitByTables(cleaned) };
  }, [linked]);

  return (
    <div style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)" }}>
      {rendered.columns ? (
        <>
          {rendered.segments.map((seg, i) =>
            seg.type === "table" ? (
              <SmartTable key={i} headers={seg.headers} rows={seg.rows} />
            ) : (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={components}>
                {badgeifyContent(seg.raw)}
              </ReactMarkdown>
            ),
          )}
          <Columns>{rendered.columns}</Columns>
        </>
      ) : (
        rendered.segments.map((seg, i) =>
          seg.type === "table" ? (
            <SmartTable key={i} headers={seg.headers} rows={seg.rows} />
          ) : (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={components}>
              {badgeifyContent(seg.raw)}
            </ReactMarkdown>
          ),
        )
      )}
    </div>
  );
}
