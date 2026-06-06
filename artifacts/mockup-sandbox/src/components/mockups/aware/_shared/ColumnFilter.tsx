import React from "react";
import { ChevronDown, Search, X } from "lucide-react";

export interface ColumnFilterState {
  text: string;
  selected: string[];
}

export function TableHeaderFilter({
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

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
          isActive ? "text-[var(--gcp-blue)]" : "text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]"
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="bg-[var(--gcp-blue)] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold ml-1">{activeCount}</span>
        )}
        <ChevronDown size={10} className={`ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 z-50 gcp-card shadow-lg border border-[var(--gcp-grey)] p-2 bg-[var(--gcp-surface)]">
          <div className="flex items-center gap-1 border border-[var(--gcp-grey)] rounded px-2 py-1 mb-2">
            <Search size={12} className="text-[var(--gcp-text-secondary)] shrink-0" />
            <input
              type="text"
              value={filter.text}
              onChange={e => onFilterChange({ ...filter, text: e.target.value })}
              placeholder="Search..."
              className="flex-1 text-[12px] outline-none bg-transparent border-none p-0 m-0"
              autoFocus
            />
            {filter.text && (
              <button onClick={() => onFilterChange({ ...filter, text: "" })} className="shrink-0">
                <X size={12} className="text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]" />
              </button>
            )}
          </div>
          {allValues && (
            <div className="max-h-40 overflow-auto space-y-0.5">
              {filteredValues.map(v => (
                <label key={v} className="flex items-center gap-2 px-1 py-0.5 hover:bg-[var(--gcp-surface-hover)] rounded cursor-pointer text-[12px]">
                  <input
                    type="checkbox"
                    checked={filter.selected.includes(v)}
                    onChange={() => toggleValue(v)}
                    className="accent-[var(--gcp-blue)]"
                  />
                  {v}
                </label>
              ))}
              {filteredValues.length === 0 && (
                <div className="text-[11px] text-[var(--gcp-text-secondary)] px-1 py-2">No matches</div>
              )}
            </div>
          )}
          {activeCount > 0 && (
            <button
              onClick={() => onFilterChange({ text: "", selected: [] })}
              className="w-full text-[11px] text-[var(--gcp-blue)] hover:underline mt-1 pt-1 border-t border-[var(--gcp-grey)] text-center"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
