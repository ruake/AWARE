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
  Bug,
} from "lucide-react";
import type { TestCase } from "@/lib/types";
import { ConsolePagination } from "@/components/console";

const PAGE_SIZE = 25;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  web: <Globe size={14} />,
  api: <Terminal size={14} />,
  http: <Server size={14} />,
  edgeworker: <Zap size={14} />,
  transaction: <Unlink size={14} />,
  pytest: <TestTube size={14} />,
};

const TYPE_COLORS: Record<string, string> = {
  web: "var(--proof-blue)",
  api: "var(--proof-green)",
  http: "var(--proof-purple)",
  edgeworker: "var(--proof-orange)",
  transaction: "var(--proof-cyan)",
  pytest: "var(--proof-yellow)",
};

const TYPE_BGS: Record<string, string> = {
  web: "rgba(59,130,246,0.12)",
  api: "rgba(34,197,94,0.12)",
  http: "rgba(168,85,247,0.12)",
  edgeworker: "rgba(245,158,11,0.12)",
  transaction: "rgba(6,182,212,0.12)",
  pytest: "rgba(234,179,8,0.12)",
};

const CAT_COLORS: Record<string, string> = {
  "geo-match": "var(--proof-blue)",
  caching: "var(--proof-purple)",
  security: "var(--proof-red)",
  performance: "var(--proof-green)",
  functional: "var(--proof-orange)",
  general: "var(--proof-text-secondary)",
  network: "var(--proof-cyan)",
  screenshots: "var(--proof-yellow)",
  "url-health": "var(--proof-pink)",
  "edge-routing": "var(--proof-indigo)",
  "http-protocol": "var(--proof-teal)",
};

const CAT_BGS: Record<string, string> = {
  "geo-match": "rgba(59,130,246,0.1)",
  caching: "rgba(168,85,247,0.1)",
  security: "rgba(239,68,68,0.1)",
  performance: "rgba(34,197,94,0.1)",
  functional: "rgba(245,158,11,0.1)",
  general: "rgba(154,160,166,0.1)",
  network: "rgba(6,182,212,0.1)",
  screenshots: "rgba(234,179,8,0.1)",
  "url-health": "rgba(236,72,153,0.1)",
  "edge-routing": "rgba(99,102,241,0.1)",
  "http-protocol": "rgba(20,184,166,0.1)",
};

export const PRI_COLORS: Record<string, string> = {
  P0: "var(--proof-red)",
  P1: "var(--proof-yellow)",
  P2: "var(--proof-blue)",
  P3: "var(--proof-text-muted)",
};

const PRI_BGS: Record<string, string> = {
  P0: "rgba(239,68,68,0.12)",
  P1: "rgba(234,179,8,0.12)",
  P2: "rgba(59,130,246,0.12)",
  P3: "rgba(154,160,166,0.08)",
};

const STATUS_COLORS: Record<string, string> = {
  active: "var(--proof-green)",
  disabled: "var(--proof-yellow)",
  deprecated: "var(--proof-red)",
};

const STATUS_BGS: Record<string, string> = {
  active: "rgba(34,197,94,0.12)",
  disabled: "rgba(234,179,8,0.12)",
  deprecated: "rgba(239,68,68,0.12)",
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
                    const filePath = test.scriptPath?.split("::")[0];
                    if (filePath)
                      window.open(
                        `https://github.com/ruake/AWARE/blob/main/${filePath}`,
                        "_blank",
                      );
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
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/tests?suite=${suiteFilter}&detail=${test.id}`,
                        );
                      }}
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color:
                          detailId === test.id
                            ? "var(--proof-blue)"
                            : "var(--proof-text-muted)",
                        padding: 2,
                        display: "inline-flex",
                      }}
                      title="Show details"
                    >
                      <Bug size={13} />
                    </button>
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
