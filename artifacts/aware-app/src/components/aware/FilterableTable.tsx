import React from "react";

export interface FilterableColumn {
  label: string;
  field: string;
  type?: "string" | "number" | "boolean" | "date";
  format?: (val: unknown) => string;
  filterType?: "string" | "select";
  options?: string[];
}

export interface FilterableTableProps {
  columns: FilterableColumn[];
  rows: Record<string, unknown>[];
  title?: string;
  height?: string;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
  searchPlaceholder?: string;
  options?: Record<string, unknown>;
}

export function FilterableTable({
  columns,
  rows,
  title,
  height = "400px",
  pageSize = 25,
  onRowClick,
  searchPlaceholder = "Search...",
  options: _options = {},
}: FilterableTableProps) {
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = React.useState("");
  const [sortCol, setSortCol] = React.useState<number | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);
  const [page, setPage] = React.useState(0);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const matches = columns.some((col) => {
          const val = row[col.field];
          return String(val ?? "")
            .toLowerCase()
            .includes(q);
        });
        if (!matches) return false;
      }
      for (const col of columns) {
        const filterVal = filters[col.field];
        if (!filterVal) continue;
        const cellVal = String(row[col.field] ?? "").toLowerCase();
        if (!cellVal.includes(filterVal.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, filters, globalSearch, columns]);

  const sortedRows = React.useMemo(() => {
    if (sortCol === null) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[columns[sortCol].field];
      const bVal = b[columns[sortCol].field];
      const aStr = String(aVal ?? "").toLowerCase();
      const bStr = String(bVal ?? "").toLowerCase();
      const aNum = parseFloat(aStr);
      const bNum = parseFloat(bStr);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortAsc ? aNum - bNum : bNum - aNum;
      }
      if (aStr < bStr) return sortAsc ? -1 : 1;
      if (aStr > bStr) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortCol, sortAsc, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const pagedRows = sortedRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function toggleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortAsc((prev) => !prev);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  }

  return (
    <div className="proof-stack" style={{ gap: 12, height }}>
      {title && <div className="proof-section-title" style={{ fontWeight: 700, fontSize: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>{title}</div>}
      {/* Filters row */}
      <div className="proof-filter-bar glass-panel" style={{ padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", borderRadius: "var(--proof-radius-md)" }}>
        <input
          className="proof-input"
          style={{ width: 220, height: 32, borderRadius: "var(--proof-radius-full)", paddingLeft: 16, background: "rgba(255,255,255,0.03)", border: "1px solid var(--proof-border)", transition: "all var(--proof-transition)" }}
          placeholder={searchPlaceholder}
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,196,255,0.5)";
            e.currentTarget.style.boxShadow = "var(--proof-glow-cyan)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--proof-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {columns
          .filter((c) => c.filterType === "select" && c.options && c.options.length > 0)
          .map((col) => (
            <select
              key={col.field}
              className="proof-select"
              style={{ height: 32, width: "auto", borderRadius: "var(--proof-radius-full)", background: filters[col.field] ? "var(--proof-surface-active)" : "rgba(255,255,255,0.03)", borderColor: filters[col.field] ? "var(--proof-blue)" : "var(--proof-border)", boxShadow: filters[col.field] ? "var(--proof-glow-cyan)" : "none", color: filters[col.field] ? "var(--proof-text)" : "var(--proof-text-secondary)" }}
              value={filters[col.field] || ""}
              onChange={(e) => setFilters((f) => ({ ...f, [col.field]: e.target.value }))}
            >
              <option value="">{col.label}</option>
              {col.options!.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
        {Object.keys(filters).some((k) => filters[k]) && (
          <button
            className="proof-button-xs"
            onClick={() => setFilters({})}
            style={{ color: "var(--proof-red)", background: "transparent", border: "1px solid var(--proof-red-border)", padding: "4px 12px", borderRadius: "var(--proof-radius-full)" }}
          >
            Clear filters
          </button>
        )}
      </div>
      {/* HTML table with sort */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflow: "auto",
          padding: 0,
          border: "1px solid var(--proof-border)",
          borderRadius: "var(--proof-radius-md)",
        }}
      >
        <table className="proof-table" style={{ fontSize: 13, borderSpacing: 0, width: "100%" }}>
          <thead>
            <tr className="proof-tr" style={{ background: "rgba(255,255,255,0.02)" }}>
              {columns.map((col, i) => (
                <th
                  key={col.field}
                  className="proof-th"
                  onClick={() => toggleSort(i)}
                  style={{
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "color var(--proof-transition)",
                    color: sortCol === i ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                    borderBottom: "1px solid var(--proof-border)",
                    padding: "12px 16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontSize: "12px"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--proof-text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = sortCol === i ? "var(--proof-blue)" : "var(--proof-text-secondary)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {col.label}
                    <span style={{ fontSize: 10, opacity: sortCol === i ? 1 : 0.3, color: sortCol === i ? "var(--proof-blue)" : "inherit" }}>
                      {sortCol === i ? (sortAsc ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="proof-empty-state" style={{ padding: 48, textAlign: "center", color: "var(--proof-text-muted)" }}>
                  No matching rows
                </td>
              </tr>
            ) : (
              pagedRows.map((row, ri) => {
                const isOdd = ri % 2 === 1;
                return (
                <tr
                  key={ri}
                  className="proof-tr"
                  onClick={() => onRowClick?.(row)}
                  style={{
                    cursor: onRowClick ? "pointer" : undefined,
                    transition: "background var(--proof-transition)",
                    background: isOdd ? "var(--proof-surface-2)" : "transparent"
                  }}
                  onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.background = "var(--proof-surface-hover)"; }}
                  onMouseLeave={(e) => { if (onRowClick) e.currentTarget.style.background = isOdd ? "var(--proof-surface-2)" : "transparent"; }}
                >
                  {columns.map((col) => {
                    const val = row[col.field];
                    const isNumber = typeof val === "number";
                    return (
                      <td key={col.field} className="proof-td" style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontFamily: isNumber ? "var(--font-mono)" : "inherit" }}>
                        {col.format ? col.format(val) : String(val ?? "")}
                      </td>
                    );
                  })}
                </tr>
              )}))
            }
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="proof-meta">
          Showing {pagedRows.length} of {sortedRows.length} rows
        </span>
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              className="proof-button-xs"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </button>
            <span className="proof-meta">
              {page + 1} / {totalPages}
            </span>
            <button
              className="proof-button-xs"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
