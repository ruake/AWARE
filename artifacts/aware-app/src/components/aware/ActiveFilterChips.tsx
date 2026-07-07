import React from "react";
import { X, SlidersHorizontal } from "lucide-react";
import type { FilterState } from "@/lib/filterStore";

interface ActiveFilterChipsProps {
  filters: FilterState;
  onRemoveFilter: <K extends keyof FilterState>(key: K, value?: FilterState[K]) => void;
  onClearAll: () => void;
}

function chipLabel(key: keyof FilterState, value: unknown): string {
  switch (key) {
    case "search":
      return `Search: "${value}"`;
    case "env":
      return `Env: ${(value as string[]).join(", ")}`;
    case "suites":
      return `Suite: ${(value as string[]).join(", ")}`;
    case "status":
      return `Status: ${(value as string[]).join(", ")}`;
    case "category":
      return `Category: ${(value as string[]).join(", ")}`;
    case "dateRange": {
      const dr = value as { start: string; end: string };
      return `${dr.start} – ${dr.end}`;
    }
    case "tags":
      return `Tags: ${(value as string[]).join(", ")}`;
    default:
      return "";
  }
}

export function ActiveFilterChips({ filters, onRemoveFilter, onClearAll }: ActiveFilterChipsProps) {
  const active: { key: keyof FilterState; label: string }[] = [];

  if (filters.search) {
    active.push({ key: "search", label: chipLabel("search", filters.search) });
  }
  if (filters.env.length > 0) {
    active.push({ key: "env", label: chipLabel("env", filters.env) });
  }
  if (filters.suites.length > 0) {
    active.push({ key: "suites", label: chipLabel("suites", filters.suites) });
  }
  if (filters.status.length > 0) {
    active.push({ key: "status", label: chipLabel("status", filters.status) });
  }
  if (filters.category.length > 0) {
    active.push({ key: "category", label: chipLabel("category", filters.category) });
  }
  if (filters.dateRange) {
    active.push({ key: "dateRange", label: chipLabel("dateRange", filters.dateRange) });
  }
  if (filters.tags.length > 0) {
    active.push({ key: "tags", label: chipLabel("tags", filters.tags) });
  }

  if (active.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--proof-text-muted)", fontSize: 13, fontWeight: 500 }}>
        <SlidersHorizontal size={14} />
        <span>No active filters</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {active.map((chip) => (
        <span
          key={chip.key}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: "var(--proof-radius-full)",
            background: "var(--proof-blue-bg)", border: "1px solid var(--proof-blue-border)",
            color: "var(--proof-blue-bright)", fontSize: 12, fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {chip.label}
          <button
            onClick={() => {
              if (chip.key === "search") onRemoveFilter("search", "");
              else if (chip.key === "dateRange") onRemoveFilter("dateRange", null);
              else onRemoveFilter(chip.key, []);
            }}
            aria-label={`Remove ${chip.key} filter`}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--proof-blue-bright)", padding: 0, display: "flex",
              opacity: 0.7, transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: "var(--proof-radius-full)",
          background: "transparent", border: "1px solid var(--proof-border)",
          color: "var(--proof-text-muted)", fontSize: 11, fontWeight: 700,
          cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--proof-surface-hover)";
          e.currentTarget.style.color = "var(--proof-text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--proof-text-muted)";
        }}
      >
        <X size={12} /> Clear all
      </button>
    </div>
  );
}
