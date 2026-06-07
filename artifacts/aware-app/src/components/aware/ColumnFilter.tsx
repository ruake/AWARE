import React from "react";

export interface ColumnFilterState {
  text: string;
  selected: string[];
}

export function ColumnFilter({
  label,
  allValues,
  filter,
  onFilterChange,
}: {
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

  const filteredValues = allValues?.filter(v =>
    v.toLowerCase().includes(filter.text.toLowerCase())
  ) ?? [];

  const toggleValue = (v: string) => {
    const next = filter.selected.includes(v)
      ? filter.selected.filter(x => x !== v)
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
          display: "flex", alignItems: "center", gap: 3,
          fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.5px",
          color: isActive ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
          background: "none", border: "none", cursor: "pointer",
          padding: 0, whiteSpace: "nowrap",
        }}
      >
        {label}
        {activeCount > 0 && (
          <span style={{
            background: "var(--gcp-blue)", color: "white",
            borderRadius: "50%", width: 16, height: 16,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, marginLeft: 2, flexShrink: 0,
          }}>{activeCount}</span>
        )}
        <span style={{ fontSize: 9, marginLeft: 2, transform: open ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0,
          width: 220, zIndex: 50,
          background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)",
          borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          padding: 8,
        }} role="listbox">
          <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "4px 8px", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={filter.text}
              onChange={e => onFilterChange({ ...filter, text: e.target.value })}
              placeholder="Search..."
              style={{
                flex: 1, fontSize: 12, outline: "none",
                background: "transparent", border: "none", padding: 0,
                color: "var(--gcp-text)", fontFamily: "var(--font-sans)",
              }}
            />
            {filter.text && (
              <button
                onClick={() => onFilterChange({ ...filter, text: "" })}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--gcp-text-secondary)", lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>
          {allValues && (
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {filteredValues.map(v => (
                <label key={v} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 4px", borderRadius: 3, cursor: "pointer",
                  fontSize: 12, color: "var(--gcp-text)",
                }}>
                  <input
                    type="checkbox"
                    checked={filter.selected.includes(v)}
                    onChange={() => toggleValue(v)}
                    style={{ accentColor: "var(--gcp-blue)" }}
                  />
                  {v}
                </label>
              ))}
              {filteredValues.length === 0 && (
                <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", padding: "4px 4px" }}>No matches</div>
              )}
            </div>
          )}
          {activeCount > 0 && (
            <button
              onClick={() => onFilterChange({ text: "", selected: [] })}
              style={{
                width: "100%", fontSize: 11, color: "var(--gcp-blue)",
                background: "none", border: "none", cursor: "pointer",
                marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--gcp-grey)",
                textAlign: "center",
              }}
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
