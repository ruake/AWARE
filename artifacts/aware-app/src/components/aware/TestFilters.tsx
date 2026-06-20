import React from "react";
import { Search, X, FolderTree } from "lucide-react";

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
  height: 32,
  fontSize: 12,
  background: "var(--proof-surface)",
  border: "1px solid var(--proof-border)",
  borderRadius: 4,
  color: "var(--proof-text)",
  padding: "0 8px",
  cursor: "pointer",
  outline: "none",
  fontFamily: "var(--font-sans)",
  minWidth: 110,
};
const inputStyle: React.CSSProperties = {
  height: 32,
  fontSize: 12,
  background: "var(--proof-surface)",
  border: "1px solid var(--proof-border)",
  borderRadius: 4,
  color: "var(--proof-text)",
  padding: "0 8px",
  outline: "none",
  fontFamily: "var(--font-sans)",
  width: 220,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--proof-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
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
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        background: "var(--proof-sidebar-bg)",
        borderBottom: "1px solid var(--proof-border)",
        flexWrap: "wrap",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 8,
            color: "var(--proof-text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search tests..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 28 }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Type</span>
        <select
          value={testType}
          onChange={(e) => onTestTypeChange(e.target.value)}
          style={selectStyle}
        >
          {TEST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t} {t !== "All" ? `(${typeCounts[t] || 0})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Cat</span>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{ ...selectStyle, minWidth: 100 }}
        >
          {TEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c} {c !== "All" ? `(${categoryCounts[c] || 0})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Status</span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{ ...selectStyle, minWidth: 90 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={labelStyle}>Pri</span>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          style={{ ...selectStyle, minWidth: 75 }}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      {suiteFilter && selectedSuite && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "var(--proof-blue)",
            background: "var(--proof-blue)10",
            padding: "2px 8px",
            borderRadius: 4,
          }}
        >
          <FolderTree size={12} /> {selectedSuite.name}
          <button
            onClick={onClearSuite}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--proof-text-secondary)",
              padding: 0,
              lineHeight: 1,
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            color: "var(--proof-text-secondary)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap",
          }}
        >
          {filteredCount} of {totalCount} tests
        </span>
      </div>
    </div>
  );
}
