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
  Info,
  LineChart as ChartIcon} from "lucide-react";
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
  STATUS_BGS} from "@/lib/testColors";

const PAGE_SIZE = 25;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  web: <Globe size={13} />,
  api: <Terminal size={13} />,
  http: <Server size={13} />,
  edgeworker: <Zap size={13} />,
  transaction: <Unlink size={13} />,
  pytest: <TestTube size={13} />};

import { motion, AnimatePresence } from "framer-motion";

type SortKey = "id" | "name" | "category" | "priority" | "status" | "owner";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3};

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  disabled: 1,
  deprecated: 2};

function sortTests(tests: TestCase[], key: SortKey, dir: SortDir): TestCase[] {
  return [...tests].sort((a, b) => {
    let cmp;
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
  onClearFilters?: () => void;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={10} style={{ opacity: 0.3 }} />;
  return sortDir === "asc"
    ? <ChevronUp size={10} style={{ color: "var(--proof-blue)" }} />
    : <ChevronDown size={10} style={{ color: "var(--proof-blue)" }} />;
}

interface SortableThProps {
  col: SortKey;
  label: string;
  center?: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortableTh({ col, label, center, sortKey, sortDir, onSort }: SortableThProps) {
  return (
    <th
      className="proof-th"
      style={{
        textAlign: center ? "center" : "left",
        cursor: "pointer",
        position: "sticky",
        top: 0,
        zIndex: 10}}
      onClick={() => onSort(col)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(col);
        }
      }}
      tabIndex={0}
      aria-sort={sortKey === col ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span 
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );
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
  onClearFilters}: TestListProps) {
  const [, navigate] = useLocation();
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const pageItems = React.useMemo(
    () => sortTests(rawItems, sortKey, sortDir),
    [rawItems, sortKey, sortDir],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

  React.useEffect(() => {
    onPageChange(1);
  }, [sortKey, sortDir, onPageChange]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden"}}
    >
      <div style={{ overflowX: "auto", flex: 1, minHeight: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 4 }} />
            <col style={{ width: 120 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr className="proof-tr">
              <th className="proof-th" style={{ width: 4, padding: 0 }} />
              <SortableTh col="id" label="ID" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh col="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="proof-th" style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 10 }}>
                Type
              </th>
              <SortableTh col="category" label="Category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh col="priority" label="Pri" center sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh col="status" label="Status" center sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="proof-th" style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 10 }}>
                Coverage
              </th>
              <th className="proof-th" style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 10 }} />
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr className="proof-tr">
                <td
                  colSpan={9}
                  style={{
                    textAlign: "center",
                    padding: 48,
                    color: "var(--proof-text-secondary)",
                    fontSize: 13}}
                >
                  <div className="proof-empty-state">
                    <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontWeight: 600, margin: '0 0 8px 0' }}>No tests match the current filters</p>
                    <button
                      className="proof-button"
                      onClick={onClearFilters}
                      style={{ fontSize: 11 }}
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((test, index) => {
                const isExpanded = expandedIds.has(test.id);

                return (
                  <React.Fragment key={test.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: (index % 10) * 0.03 }}
                      className="proof-tr"
                      style={{
                        cursor: "pointer",
                        transition: "background 0.1s",
                        height: 48}}
                      onMouseEnter={() => onHoverRow(test.id)}
                      onMouseLeave={() => onHoverRow(null)}
                      onClick={(e) => toggleExpand(test.id, e)}
                      role="button"
                      tabIndex={0}
                    >
                      <td className="proof-td" style={{ 
                        padding: 0, 
                        background: CAT_COLORS[test.category] || "transparent",
                        width: 4 
                      }} />
                      <td
                        className="proof-td"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--proof-text-muted)",
                          whiteSpace: "nowrap"}}
                      >
                        {test.id}
                      </td>
                      <td
                        className="proof-td"
                        style={{
                          fontWeight: 600,
                          color: "var(--proof-text)",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"}}
                      >
                        <span style={{ color: hoveredRow === test.id ? "var(--proof-blue)" : "inherit" }}>
                          {test.name}
                        </span>
                      </td>
                      <td className="proof-td" style={{ textAlign: "center" }}>
                        <span
                          className="proof-badge"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            color: TYPE_COLORS[test.testType] || "var(--proof-text-secondary)",
                            background: TYPE_BGS[test.testType] || "var(--proof-subtle-bg)",
                            border: `1px solid ${TYPE_COLORS[test.testType]}40`
                          }}
                        >
                          {TYPE_ICONS[test.testType] || null} {test.testType.toUpperCase()}
                        </span>
                      </td>
                      <td className="proof-td">
                        <span
                          className="proof-badge"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: CAT_COLORS[test.category] || "var(--proof-text-secondary)",
                            background: CAT_BGS[test.category] || "var(--proof-subtle-bg)",
                            border: `1px solid ${CAT_COLORS[test.category]}40`
                          }}
                        >
                          {test.category}
                        </span>
                      </td>
                      <td className="proof-td" style={{ textAlign: "center" }}>
                        <span
                          className="proof-badge"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: 10,
                            fontWeight: 800,
                            fontFamily: "var(--font-mono)",
                            color: PRI_COLORS[test.priority] || "var(--proof-text-secondary)",
                            background: PRI_BGS[test.priority] || "var(--proof-subtle-bg)",
                            border: `1px solid ${PRI_COLORS[test.priority]}40`,
                            minWidth: 32,
                            justifyContent: 'center'
                          }}
                        >
                          {test.priority}
                        </span>
                      </td>
                      <td className="proof-td" style={{ textAlign: "center" }}>
                        <span
                          className="proof-badge"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            color: STATUS_COLORS[test.status] || "var(--proof-text-secondary)",
                            background: STATUS_BGS[test.status] || "var(--proof-subtle-bg)",
                            border: `1px solid ${STATUS_COLORS[test.status]}40`
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                          {test.status}
                        </span>
                      </td>
                      <td className="proof-td" style={{ textAlign: "center" }}>
                        {(() => {
                          const coverage = test.assertionsPassed != null && test.assertionsFailed != null 
                            ? test.assertionsPassed / (test.assertionsPassed + test.assertionsFailed)
                            : null;
                          if (coverage === null || isNaN(coverage)) return <span className="proof-meta">--</span>;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 60 }}>
                              <div style={{ 
                                flex: 1, 
                                height: 4, 
                                background: 'var(--proof-border)', 
                                borderRadius: 2,
                                overflow: 'hidden'
                              }}>
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${coverage * 100}%` }}
                                  style={{ 
                                    height: '100%', 
                                    background: coverage >= 0.95 ? 'var(--proof-green)' : coverage >= 0.8 ? 'var(--proof-yellow)' : 'var(--proof-red)'
                                  }} 
                                />
                              </div>
                              <span className="proof-meta">
                                {Math.round(coverage * 100)}%
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="proof-td" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                          {test.scriptPath && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const filePath = test.scriptPath?.split("::")[0];
                                if (filePath) window.open(`${repo}/blob/main/${filePath}`, "_blank");
                              }}
                              className="proof-button-xs"
                              style={{ background: 'transparent', border: 'none', padding: 4 }}
                              title="View source on GitHub"
                              aria-label="View source on GitHub"
                            >
                              <ExternalLink size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tests?suite=${suiteFilter}&detail=${test.id}`);
                            }}
                            className="proof-button-xs"
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              padding: 4,
                              color: detailId === test.id ? "var(--proof-blue)" : undefined
                            }}
                            title="Show details"
                            aria-label="Show test details"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td className="proof-td" style={{ padding: 0, background: CAT_COLORS[test.category] || "transparent" }} />
                        <td
                          colSpan={8}
                          className="proof-td"
                          style={{
                            background: "var(--proof-surface-hover)",
                            padding: "16px 24px"}}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--proof-text-secondary)",
                                lineHeight: 1.6,
                                maxWidth: 800
                              }}
                            >
                              {test.description || "No description provided."}
                            </div>
                            {test.tags && test.tags.length > 0 && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {test.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="proof-badge"
                                    style={{
                                      fontSize: 10,
                                      background: "var(--proof-surface)",
                                      borderColor: "var(--proof-border)",
                                      color: "var(--proof-text-secondary)"}}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                              <button
                                onClick={() => navigate(`/analytics?testId=${test.id}`)}
                                className="proof-button-xs"
                                style={{ gap: 6 }}
                              >
                                <ChartIcon size={14} /> View Historical Analytics
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/tests?suite=${suiteFilter}&detail=${test.id}`)
                                }
                                className="proof-button-xs"
                                style={{ gap: 6, background: 'transparent' }}
                              >
                                <Info size={14} /> Full Test Configuration
                              </button>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "12px 16px", flexShrink: 0, borderTop: '1px solid var(--proof-border)' }}>
        <ConsolePagination
          currentPage={clampedPage}
          totalPages={totalPages}
          totalItems={filteredCount}
          pageSize={PAGE_SIZE}
          onPageChange={onPageChange}
          onPageSizeChange={() => {}}
        />
      </div>
    </div>
  );
}
