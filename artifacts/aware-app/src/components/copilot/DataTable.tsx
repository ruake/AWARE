import React from "react";
import { useLocation } from "wouter";
import type { TableData, TableColumn } from "@/lib/copilot/types";

interface Props {
  table: TableData;
}

const ENV_COLORS: Record<string, string> = {
  QA: "rgba(59,130,246,0.15)",
  UAT: "rgba(168,85,247,0.15)",
  PROD: "rgba(34,197,94,0.15)",
  PASS: "rgba(34,197,94,0.15)",
  FAIL: "rgba(239,68,68,0.15)",
};
const ENV_TEXT: Record<string, string> = {
  QA: "#60a5fa",
  UAT: "#c084fc",
  PROD: "#4ade80",
  PASS: "#4ade80",
  FAIL: "#f87171",
};

function formatCell(
  value: string | number | null,
  col: TableColumn,
  isMax: boolean,
  isMin: boolean,
): React.ReactNode {
  if (value === null || value === undefined)
    return <span style={{ color: "var(--proof-text-muted)" }}>—</span>;

  const highlight = isMax ? "#34d399" : isMin ? "#f87171" : undefined;
  const highlightBg = isMax
    ? "rgba(52,211,153,0.08)"
    : isMin
      ? "rgba(248,113,113,0.08)"
      : undefined;

  const wrapper = (content: React.ReactNode) => (
    <span
      style={{
        color: highlight ?? "var(--proof-text)",
        background: highlightBg,
        borderRadius: 4,
        padding: highlightBg ? "1px 5px" : undefined,
        fontWeight: highlight ? 600 : undefined,
      }}
    >
      {content}
    </span>
  );

  switch (col.type) {
    case "percent":
      return wrapper(`${value}%`);
    case "duration":
      return wrapper(`${value}s`);
    case "mono":
      return (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.9em",
            color: highlight ?? "var(--proof-text-secondary)",
          }}
        >
          {String(value)}
        </span>
      );
    case "badge": {
      const str = String(value);
      const bg = ENV_COLORS[str] ?? "var(--proof-hover)";
      const tc = ENV_TEXT[str] ?? "var(--proof-text-secondary)";
      return (
        <span
          style={{
            background: bg,
            color: tc,
            borderRadius: 5,
            padding: "1px 7px",
            fontSize: "0.88em",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {str}
        </span>
      );
    }
    case "number":
      return wrapper(typeof value === "number" ? value.toLocaleString() : value);
    default:
      return <span style={{ color: "var(--proof-text-secondary)" }}>{String(value)}</span>;
  }
}

export default function DataTable({ table }: Props) {
  const [, navigate] = useLocation();
  const [sortKey, setSortKey] = React.useState<string>(table.sortBy ?? "");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(table.sortDir ?? "desc");

  const rows = React.useMemo(() => {
    if (!sortKey) return table.rows;
    return [...table.rows].sort((a, b) => {
      const av = a[sortKey],
        bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [table.rows, sortKey, sortDir]);

  // Compute max/min per column
  const colStats = React.useMemo(() => {
    const stats: Record<string, { max: number | string; min: number | string }> = {};
    for (const col of table.columns) {
      if (col.highlight === "max" || col.highlight === "min") {
        const vals = table.rows.map((r) => r[col.key]).filter((v) => v !== null && v !== undefined);
        const nums = vals.filter((v) => typeof v === "number") as number[];
        if (nums.length > 0) {
          stats[col.key] = { max: Math.max(...nums), min: Math.min(...nums) };
        }
      }
    }
    return stats;
  }, [table]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid var(--proof-border)",
        overflow: "hidden",
        margin: "10px 0",
        background: "var(--proof-hover-light)",
      }}
    >
      {/* Header */}
      {(table.title || table.subtitle) && (
        <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--proof-border)" }}>
          {table.title && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)" }}>
              {table.title}
            </div>
          )}
          {table.subtitle && (
            <div style={{ fontSize: 10.5, color: "var(--proof-text-muted)", marginTop: 2 }}>
              {table.subtitle}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11.5,
            tableLayout: "auto",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--proof-border)" }}>
              {table.columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: "7px 12px",
                    textAlign: col.align ?? "left",
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      sortKey === col.key ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: "var(--proof-subtle-bg015)",
                    userSelect: "none",
                    width: col.width ? `${col.width}px` : undefined,
                  }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 3, opacity: 0.7 }}>
                      {sortDir === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  borderBottom: ri < rows.length - 1 ? "1px solid var(--proof-border)" : "none",
                  background: ri % 2 === 0 ? "transparent" : "var(--proof-subtle-bg)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    ri % 2 === 0 ? "transparent" : "var(--proof-subtle-bg)";
                }}
              >
                {table.columns.map((col) => {
                  const val = row[col.key] ?? null;
                  const stats = colStats[col.key];
                  const isMax = stats !== undefined && val === stats.max && col.highlight === "max";
                  const isMin = stats !== undefined && val === stats.min && col.highlight === "min";
                  const href = col.link ? col.link(row) : null;
                  const cellContent = formatCell(val, col, isMax, isMin);
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: "6px 12px",
                        textAlign: col.align ?? "left",
                        whiteSpace: "nowrap",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {href ? (
                        <a
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(href);
                          }}
                          style={{
                            color: "var(--proof-blue-bright)",
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.textDecoration = "underline";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.textDecoration = "none";
                          }}
                        >
                          {cellContent}
                        </a>
                      ) : (
                        cellContent
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "5px 12px",
          borderTop: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 9.5,
          color: "var(--proof-text-muted)",
        }}
      >
        <span>
          {rows.length} row{rows.length !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>Click header to sort</span>
      </div>
    </div>
  );
}
