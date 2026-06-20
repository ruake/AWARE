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
} from "lucide-react";
import type { TestCase } from "@/lib/types";
import { ConsolePagination } from "@/components/console";
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
  web: <Globe size={14} />,
  api: <Terminal size={14} />,
  http: <Server size={14} />,
  edgeworker: <Zap size={14} />,
  transaction: <Unlink size={14} />,
  pytest: <TestTube size={14} />,
};

const cellStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 12,
  borderBottom: "1px solid var(--proof-border)",
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  color: "var(--proof-text-secondary)",
  background: "var(--proof-surface-hover)",
  borderBottom: "1px solid var(--proof-border)",
  textAlign: "left",
  whiteSpace: "nowrap",
};

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

export function TestList({
  pageItems,
  hoveredRow,
  onHoverRow,
  detailId,
  suiteFilter,
  page,
  filteredCount,
  onPageChange,
}: TestListProps) {
  const [, navigate] = useLocation();
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

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
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Type</th>
              <th style={thStyle}>Category</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Priority</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
              <th style={thStyle}>Owner</th>
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
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((test) => (
                <tr
                  key={test.id}
                  style={{
                    cursor: "pointer",
                    background:
                      hoveredRow === test.id
                        ? "var(--proof-hover)"
                        : "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={() => onHoverRow(test.id)}
                  onMouseLeave={() => onHoverRow(null)}
                  onClick={() => {
                    navigate(`/tests?suite=${suiteFilter}&detail=${test.id}`);
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
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
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
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--proof-blue-light, #60a5fa)";
                        (e.currentTarget as HTMLElement).style.textDecoration =
                          "underline";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color =
                          "var(--proof-blue)";
                        (e.currentTarget as HTMLElement).style.textDecoration =
                          "none";
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
                        color:
                          TYPE_COLORS[test.testType] ||
                          "var(--proof-text-secondary)",
                        background:
                          TYPE_BGS[test.testType] ||
                          "rgba(154,160,166,0.08)",
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
                        color:
                          CAT_COLORS[test.category] ||
                          "var(--proof-text-secondary)",
                        background:
                          CAT_BGS[test.category] ||
                          "rgba(154,160,166,0.08)",
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
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        padding: "1px 7px",
                        borderRadius: 99,
                        color:
                          PRI_COLORS[test.priority] ||
                          "var(--proof-text-secondary)",
                        background:
                          PRI_BGS[test.priority] ||
                          "rgba(154,160,166,0.08)",
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
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: 4,
                        color:
                          STATUS_COLORS[test.status] ||
                          "var(--proof-text-secondary)",
                        background:
                          STATUS_BGS[test.status] ||
                          "rgba(154,160,166,0.08)",
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
                    {test.owner}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      {test.scriptPath && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const filePath = test.scriptPath?.split("::")[0];
                            if (filePath)
                              window.open(
                                `https://github.com/ruake/AWARE/blob/main/${filePath}`,
                                "_blank",
                              );
                          }}
                          style={{
                            border: "none", background: "none", cursor: "pointer",
                            color: "var(--proof-text-muted)", padding: "2px 3px",
                            display: "inline-flex", borderRadius: 3,
                            transition: "color 0.1s, background 0.1s",
                          }}
                          title="View source on GitHub"
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
                          border: "none", background: "none", cursor: "pointer",
                          color: detailId === test.id ? "var(--proof-blue)" : "var(--proof-text-muted)",
                          padding: "2px 3px", display: "inline-flex", borderRadius: 3,
                          transition: "color 0.1s, background 0.1s",
                        }}
                        title="Show details"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = "var(--proof-blue)";
                          (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = detailId === test.id ? "var(--proof-blue)" : "var(--proof-text-muted)";
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
