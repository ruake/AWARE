import React from "react";
import { Search, Filter, X } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  resultCount?: { filtered: number; total: number };
  onClearAll?: () => void;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  resultCount,
  onClearAll,
}: FilterBarProps) {
  return (
    <div
      className="proof-card"
      style={{
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: "1 1 200px",
          minWidth: 160,
        }}
      >
        <Search size={14} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
        <input
          className="proof-input"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {filters?.map((filter, i) => (
          <div
            key={filter.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {i === 0 && <Filter size={13} style={{ color: "var(--proof-text-secondary)" }} />}
            <select
              className="proof-input"
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              aria-label={`Filter by ${filter.label}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  // select handles this naturally but we ensure focusability
                }
              }}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onClearAll && (
          <button
            onClick={onClearAll}
            className="proof-button-xs"
            aria-label="Clear all filters"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              background: "transparent",
              border: "1px solid var(--proof-border)",
              borderRadius: "var(--proof-radius-sm)",
              color: "var(--proof-text-secondary)",
              cursor: "pointer",
            }}
          >
            <X size={12} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {resultCount && (
        <span
          style={{
            fontSize: 12,
            color: "var(--proof-text-secondary)",
            marginLeft: "auto",
          }}
        >
          {resultCount.filtered} of {resultCount.total}
        </span>
      )}
    </div>
  );
}
