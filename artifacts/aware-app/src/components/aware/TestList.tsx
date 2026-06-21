import React from "react";
import { useLocation } from "wouter";
import {
  Search,
  Globe,
  Server,
  Terminal,
  TestTube,
  Unlink,
  Zap,
  ChevronRight,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import type { TestCase } from "@/lib/types";
import { ConsolePagination } from "@/components/console";
import { repo } from "@/lib/nav";
import {
  PRI_COLORS,
  PRI_BGS,
  TYPE_COLORS,
  TYPE_BGS,
  CAT_COLORS,
  CAT_BGS,
  STATUS_COLORS,
  STATUS_BGS,
} from "@/lib/testColors";

const PAGE_SIZE = 25;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  web: <Globe size={13} />,
  api: <Terminal size={13} />,
  http: <Server size={13} />,
  edgeworker: <Zap size={13} />,
  transaction: <Unlink size={13} />,
  pytest: <TestTube size={13} />,
};

const cellStyle: React.CSSProperties = {
  padding: "7px 12px",
  fontSize: 12,
  borderBottom: "1px solid var(--proof-border)",
};

const thStyle: React.CSSProperties = {
  padding: "9px 12px",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  color: "var(--proof-text-secondary)",
  background: "var(--proof-surface-hover)",
  borderBottom: "1px solid var(--proof-border)",
  textAlign: "left",
  whiteSpace: "nowrap",
  userSelect: "none",
};

type SortKey = "id" | "name" | "category" | "priority" | "status" | "owner";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  disabled: 1,
  deprecated: 2,
};

function sortTests(tests: TestCase[], key: SortKey, dir: SortDir): TestCase[] {
  return [...tests].sort((a, b) => {
    let cmp = 0;
    if (key === "priority") {
      cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    } else if (key === "status") {
      cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    } else {
      const av = String(a[key] ?? "").toLowerCase();
      const bv = String(b[key] ?? "").toLowerCase();
      cmp = av < bv ? -1 : av > bv ? 1 : 0;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

interface TestListProps {
  pageItems: TestCase[];
  hoveredRow: string | null;
  onHoverRow: (id: string | null) => void;
  detailId: string;
  suiteFilter: string;
  page: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={10} style={{ opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ChevronUp size={10} style={{ color: "var(--proof-blue)" }} />
    : <ChevronDown size={10} style={{ color: "var(--proof-blue)" }} />;
}

export function TestList({
  pageItems: rawItems,
  hoveredRow,
  onHoverRow,
  detailId,
  suiteFilter,
  page,
  filteredCount,
  onPageChange,
}: TestListProps) {
  const [, navigate] = useLocation();
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const pageItems = React.useMemo(
    () => sortTests(rawItems, sortKey, sortDir),
    [rawItems, sortKey, sortDir],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortableTh = ({
    col,
    label,
    center,
  }: {
    col: SortKey;
    label: string;
    center?: boolean;
  }) => (
    <th
      style={{
        ...thStyle,
        textAlign: center ? "center" : "left",
        cursor: "pointer",
      }}
      onClick={() => handleSort(col)}
      aria-sort={sortKey === col ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto", flex: 1, minHeight: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <SortableTh col="id" label="ID" />
              <SortableTh col="name" label="Name" />
              <th style={{ ...thStyle, textAlign: "center" }}>Type</th>
              <SortableTh col="category" label="Category" />
              <SortableTh col="priority" label="Priority" center />
              <SortableTh col="status" label="Status" center />
              <SortableTh col="owner" label="Owner" />
              <th style={{ ...thStyle, textAlign: "center" }} />
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: 48,
                    color: "var(--proof-text-secondary)",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Search size={24} style={{ opacity: 0.3 }} />
                    <span>No tests match the current filters</span>
                    <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>
                      Try clearing some filters or broadening your search
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((test) => (
                <tr
                  key={test.id}
                  style={{
                    cursor: "pointer",
                    background: hoveredRow === test.id ? "var(--proof-hover)" : "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={() => onHoverRow(test.id)}
                  onMouseLeave={() => onHoverRow(null)}
                  onClick={() => navigate(`/tests?suite=${suiteFilter}&detail=${test.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/tests?suite=${suiteFilter}&detail=${test.id}`);
                    }
                  }}
                >
                  <td
                    style={{
                      ...cellStyle,
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--proof-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {test.id}
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: "var(--proof-text)",
                      maxWidth: 360,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--proof-blue)",
                        transition: "color 0.1s",
                      }}
                    >
                      {test.name}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: TYPE_COLORS[test.testType] || "var(--proof-text-secondary)",
                        background: TYPE_BGS[test.testType] || "rgba(154,160,166,0.08)",
                      }}
                    >
                      {TYPE_ICONS[test.testType] || null} {test.testType}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: CAT_COLORS[test.category] || "var(--proof-text-secondary)",
                        background: CAT_BGS[test.category] || "rgba(154,160,166,0.08)",
                      }}
                    >
                      {test.category}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 10.5,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 8px",
                        borderRadius: 99,
                        color: PRI_COLORS[test.priority] || "var(--proof-text-secondary)",
                        background: PRI_BGS[test.priority] || "rgba(154,160,166,0.08)",
                      }}
                    >
                      {test.priority}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: STATUS_COLORS[test.status] || "var(--proof-text-secondary)",
                        background: STATUS_BGS[test.status] || "rgba(154,160,166,0.08)",
                      }}
                    >
                      {test.status}
                    </span>
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      fontSize: 11,
                      color: "var(--proof-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {test.owner ?? "—"}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      {test.scriptPath && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const filePath = test.scriptPath?.split("::")[0];
                            if (filePath) window.open(`${repo}/blob/main/${filePath}`, "_blank");
                          }}
                          style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            color: "var(--proof-text-muted)",
                            padding: "2px 4px",
                            display: "inline-flex",
                            borderRadius: 3,
                            transition: "color 0.1s, background 0.1s",
                          }}
                          title="View source on GitHub"
                          aria-label="View source on GitHub"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
                            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
                            (e.currentTarget as HTMLElement).style.background = "none";
                          }}
                        >
                          <ExternalLink size={11} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tests?suite=${suiteFilter}&detail=${test.id}`);
                        }}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color:
                            detailId === test.id ? "var(--proof-blue)" : "var(--proof-text-muted)",
                          padding: "2px 4px",
                          display: "inline-flex",
                          borderRadius: 3,
                          transition: "color 0.1s, background 0.1s",
                        }}
                        title="Show details"
                        aria-label="Show test details"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = "var(--proof-blue)";
                          (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color =
                            detailId === test.id ? "var(--proof-blue)" : "var(--proof-text-muted)";
                          (e.currentTarget as HTMLElement).style.background = "none";
                        }}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "0 16px", flexShrink: 0 }}>
        <ConsolePagination
          currentPage={clampedPage}
          totalPages={totalPages}
          totalItems={filteredCount}
          pageSize={PAGE_SIZE}
          onPageChange={onPageChange}
          onPageSizeChange={() => {}}
          pageSizeOptions={[PAGE_SIZE]}
        />
      </div>
    </div>
  );
}
