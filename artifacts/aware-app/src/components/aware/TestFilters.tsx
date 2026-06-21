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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "var(--proof-sidebar-bg)",
        borderBottom: "1px solid var(--proof-border)",
        flexWrap: "wrap",
        flexShrink: 0,
      }}
    >
      {/* Search */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Search
          size={13}
          style={{
            position: "absolute",
            left: 8,
            color: "var(--proof-text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search tests…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 28 }}
          aria-label="Search tests"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            style={{
              position: "absolute",
              right: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--proof-text-muted)",
              display: "flex",
              padding: 0,
            }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Type</span>
        <select
          value={testType}
          onChange={(e) => onTestTypeChange(e.target.value)}
          style={{
            ...selectStyle,
            borderColor: testType !== "All" ? "var(--proof-blue-border)" : undefined,
          }}
          aria-label="Filter by type"
        >
          {TEST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}{t !== "All" ? ` (${typeCounts[t] ?? 0})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Category</span>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{
            ...selectStyle,
            minWidth: 120,
            borderColor: category !== "All" ? "var(--proof-blue-border)" : undefined,
          }}
          aria-label="Filter by category"
        >
          {TEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}{c !== "All" ? ` (${categoryCounts[c] ?? 0})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Status</span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            ...selectStyle,
            minWidth: 95,
            borderColor: status !== "All" ? "var(--proof-blue-border)" : undefined,
          }}
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Priority filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Priority</span>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          style={{
            ...selectStyle,
            minWidth: 80,
            borderColor: priority !== "All" ? "var(--proof-blue-border)" : undefined,
          }}
          aria-label="Filter by priority"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
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
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            color: filteredCount < totalCount ? "var(--proof-blue)" : "var(--proof-text-secondary)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap",
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
