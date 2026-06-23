import React from "react";
import { X } from "lucide-react";

export interface ColumnFilterState {
  text: string;
  selected: string[];
}

export const EMPTY_FILTER: ColumnFilterState = { text: "", selected: [] };

export function priorityColor(p: string): string {
  return p === "P0" ? "var(--proof-red)" : p === "P1" ? "var(--proof-orange)" : p === "P2" ? "var(--proof-blue)" : "var(--proof-text-muted)";
}

export function ColumnFilter({
  label,
  allValues,
  filter,
  onFilterChange}: {
  label: string;
  allValues?: string[];
  filter: ColumnFilterState;
  onFilterChange: (f: ColumnFilterState) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, close]);

  const filteredValues =
    allValues?.filter((v) => v.toLowerCase().includes(filter.text.toLowerCase())) ?? [];

  const toggleValue = (v: string) => {
    const next = filter.selected.includes(v)
      ? filter.selected.filter((x) => x !== v)
      : [...filter.selected, v];
    onFilterChange({ ...filter, selected: next });
  };

  const activeCount = filter.selected.length;
  const isActive = activeCount > 0 || filter.text !== "";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={toggleRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: isActive ? "var(--proof-blue)" : "var(--proof-text-secondary)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          whiteSpace: "nowrap"}}
      >
        {label}
        {activeCount > 0 && (
          <span
            style={{
              background: "var(--proof-blue)",
              color: "white",
              borderRadius: "50%",
              width: 16,
              height: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              marginLeft: 2,
              flexShrink: 0}}
          >
            {activeCount}
          </span>
        )}
        <span
          style={{
            fontSize: 9,
            marginLeft: 2,
            transform: open ? "rotate(180deg)" : "none",
            display: "inline-block",
            transition: "transform 0.15s"}}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="glass-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: 240,
            zIndex: 50,
            border: "1px solid var(--proof-border)",
            borderRadius: "var(--proof-radius-lg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            padding: 12}}
          role="listbox"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--proof-border)",
              borderRadius: "var(--proof-radius-full)",
              padding: "6px 12px",
              marginBottom: 12,
              transition: "border-color var(--proof-transition)",
              boxShadow: filter.text ? "var(--proof-glow-cyan)" : "none",
              borderColor: filter.text ? "var(--proof-blue)" : "var(--proof-border)"
            }}
          >
            <span style={{ fontSize: 13, color: filter.text ? "var(--proof-blue)" : "var(--proof-text-secondary)" }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={filter.text}
              onChange={(e) => onFilterChange({ ...filter, text: e.target.value })}
              placeholder="Search..."
              style={{
                flex: 1,
                fontSize: 13,
                background: "transparent",
                border: "none",
                padding: 0,
                color: "var(--proof-text)",
                fontFamily: "var(--font-sans)",
                outline: "none"
              }}
            />
            {filter.text && (
              <button
                onClick={() => onFilterChange({ ...filter, text: "" })}
                aria-label="Clear search"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "var(--proof-text-secondary)",
                  lineHeight: 1,
                  padding: 0}}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {allValues && (
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {filteredValues.map((v) => {
                const isSelected = filter.selected.includes(v);
                return (
                <label
                  key={v}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: "var(--proof-radius-sm)",
                    cursor: "pointer",
                    fontSize: 13,
                    color: isSelected ? "var(--proof-text)" : "var(--proof-text-secondary)",
                    transition: "all var(--proof-transition)",
                    background: isSelected ? "rgba(255,255,255,0.05)" : "transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--proof-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: `1px solid ${isSelected ? "var(--proof-blue)" : "var(--proof-border-strong)"}`,
                    background: isSelected ? "var(--proof-blue)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isSelected ? "0 0 8px rgba(0,196,255,0.4)" : "none"
                  }}>
                    {isSelected && <svg viewBox="0 0 14 14" fill="none" style={{ width: 10, height: 10 }}><path d="M3 7.5L5.5 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleValue(v)}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                  />
                  {v}
                </label>
              )})}
              {filteredValues.length === 0 && (
                <div
                  style={{ fontSize: 11, color: "var(--proof-text-secondary)", padding: "4px 4px" }}
                >
                  No matches
                </div>
              )}
            </div>
          )}
          {activeCount > 0 && (
            <button
              onClick={() => onFilterChange({ text: "", selected: [] })}
              style={{
                width: "100%",
                fontSize: 11,
                color: "var(--proof-blue)",
                background: "none",
                border: "none",
                cursor: "pointer",
                marginTop: 4,
                paddingTop: 4,
                borderTop: "1px solid var(--proof-grey)",
                textAlign: "center"}}
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
