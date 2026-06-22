import React from "react";
import { Search, X, FolderTree, RotateCcw } from "lucide-react";

const TEST_TYPES = ["All", "web", "api", "http", "edgeworker", "transaction", "pytest"] as const;
const TEST_CATEGORIES = [
  "All",
  "geo-match",
  "caching",
  "security",
  "performance",
  "functional",
  "general",
  "network",
  "screenshots",
  "url-health",
  "edge-routing",
  "http-protocol",
] as const;
const STATUSES = ["All", "active", "disabled", "deprecated"] as const;
const PRIORITIES = ["All", "P0", "P1", "P2", "P3"] as const;

const selectStyle: React.CSSProperties = {
  height: 30,
  fontSize: 12,
  background: "var(--proof-surface)",
  border: "1px solid var(--proof-border)",
  borderRadius: 5,
  color: "var(--proof-text)",
  padding: "0 8px",
  cursor: "pointer",
  outline: "none",
  fontFamily: "var(--font-sans)",
  minWidth: 110,
  transition: "border-color 0.12s",
  appearance: "auto",
};

const inputStyle: React.CSSProperties = {
  height: 30,
  fontSize: 12,
  background: "var(--proof-surface)",
  border: "1px solid var(--proof-border)",
  borderRadius: 5,
  color: "var(--proof-text)",
  padding: "0 8px",
  outline: "none",
  fontFamily: "var(--font-sans)",
  width: 200,
  transition: "border-color 0.12s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--proof-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  whiteSpace: "nowrap",
};

interface TestFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  testType: string;
  onTestTypeChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  priority: string;
  onPriorityChange: (val: string) => void;
  suiteFilter: string;
  selectedSuite: { name: string; id: string } | null;
  onClearSuite: () => void;
  typeCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  filteredCount: number;
  totalCount: number;
}

export function TestFilters({
  search,
  onSearchChange,
  testType,
  onTestTypeChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  suiteFilter,
  selectedSuite,
  onClearSuite,
  typeCounts,
  categoryCounts,
  statusCounts,
  priorityCounts,
  filteredCount,
  totalCount,
}: TestFiltersProps) {
  const hasActiveFilters =
    search !== "" ||
    testType !== "All" ||
    category !== "All" ||
    status !== "All" ||
    priority !== "All";

  const handleClearAll = () => {
    onSearchChange("");
    onTestTypeChange("All");
    onCategoryChange("All");
    onStatusChange("All");
    onPriorityChange("All");
  };

  return (
    <div
      className="proof-filter-bar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "var(--proof-surface)",
        borderBottom: "1px solid var(--proof-border)",
        flexWrap: "nowrap",
        overflowX: "auto",
        flexShrink: 0,
        scrollbarWidth: 'none'
      }}
    >
      {/* Search */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Search
          size={13}
          style={{
            position: "absolute",
            left: 10,
            color: "var(--proof-text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          className="proof-input"
          placeholder="Search tests…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: 30, width: 220, height: 32 }}
          aria-label="Search tests"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--proof-text-muted)",
              display: "flex",
              padding: 0,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--proof-border)', margin: '0 4px', flexShrink: 0 }} />

      {/* Type filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <select
          className="proof-select"
          value={testType}
          onChange={(e) => onTestTypeChange(e.target.value)}
          style={{
            height: 32,
            minWidth: 100,
            borderColor: testType !== "All" ? "var(--proof-blue)" : undefined,
          }}
          aria-label="Filter by type"
        >
          <option value="All">All Types</option>
          {TEST_TYPES.filter(t => t !== "All").map((t) => (
            <option key={t} value={t}>
              {t} ({typeCounts[t] || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <select
          className="proof-select"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            height: 32,
            minWidth: 120,
            borderColor: category !== "All" ? "var(--proof-blue)" : undefined,
          }}
          aria-label="Filter by category"
        >
          <option value="All">All Categories</option>
          {TEST_CATEGORIES.filter(c => c !== "All").map((c) => (
            <option key={c} value={c}>
              {c} ({categoryCounts[c] || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <select
          className="proof-select"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            height: 32,
            minWidth: 100,
            borderColor: status !== "All" ? "var(--proof-blue)" : undefined,
          }}
          aria-label="Filter by status"
        >
          <option value="All">All Statuses</option>
          {STATUSES.filter(s => s !== "All").map((s) => (
            <option key={s} value={s}>
              {s} ({statusCounts[s] || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Priority filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <select
          className="proof-select"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          style={{
            height: 32,
            minWidth: 100,
            borderColor: priority !== "All" ? "var(--proof-blue)" : undefined,
          }}
          aria-label="Filter by priority"
        >
          <option value="All">All Priorities</option>
          {PRIORITIES.filter(p => p !== "All").map((p) => (
            <option key={p} value={p}>
              {p} ({priorityCounts[p] || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Active suite chip */}
      {suiteFilter && selectedSuite && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--proof-blue)",
            background: "var(--proof-blue-bg)",
            border: "1px solid var(--proof-blue-border)",
            padding: "3px 8px",
            borderRadius: 5,
          }}
        >
          <FolderTree size={11} />
          {selectedSuite.name}
          <button
            onClick={onClearSuite}
            aria-label="Clear suite filter"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--proof-blue)",
              padding: 0,
              lineHeight: 1,
              display: "flex",
              opacity: 0.7,
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Clear all filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearAll}
          aria-label="Clear all filters"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            height: 30,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            background: "var(--proof-hover)",
            border: "1px solid var(--proof-border)",
            borderRadius: 5,
            padding: "0 8px",
            cursor: "pointer",
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-strong)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
          }}
        >
          <RotateCcw size={11} />
          Clear filters
        </button>
      )}

      {/* Result count */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 1, height: 20, background: 'var(--proof-border)', flexShrink: 0 }} />
        <span
          className="proof-meta"
          style={{
            color: filteredCount < totalCount ? "var(--proof-blue)" : "var(--proof-text-secondary)",
            fontWeight: filteredCount < totalCount ? 600 : 400,
          }}
        >
          {filteredCount === totalCount
            ? `${totalCount} tests`
            : `${filteredCount} of ${totalCount} tests`}
        </span>
      </div>
    </div>
  );
}
