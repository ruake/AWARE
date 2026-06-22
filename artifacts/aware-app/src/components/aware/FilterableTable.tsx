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
      {title && <div className="proof-section-title">{title}</div>}
      {/* Filters row */}
      <div className="proof-filter-bar" style={{ padding: "8px 12px" }}>
        <input
          className="proof-input"
          style={{ width: 220, height: 32 }}
          placeholder={searchPlaceholder}
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        {columns
          .filter((c) => c.filterType === "select" && c.options && c.options.length > 0)
          .map((col) => (
            <select
              key={col.field}
              className="proof-select"
              style={{ height: 32, width: "auto" }}
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
            style={{ color: "var(--proof-red)" }}
          >
            Clear filters
          </button>
        )}
      </div>
      {/* HTML table with sort */}
      <div
        className="proof-card"
        style={{
          flex: 1,
          overflow: "auto",
          padding: 0,
        }}
      >
        <table className="proof-table" style={{ fontSize: 13 }}>
          <thead>
            <tr className="proof-tr">
              {columns.map((col, i) => (
                <th
                  key={col.field}
                  className="proof-th"
                  onClick={() => toggleSort(i)}
                  style={{
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    <span style={{ fontSize: 10, opacity: sortCol === i ? 1 : 0.3 }}>
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
                <td colSpan={columns.length} className="proof-empty-state" style={{ padding: 48 }}>
                  No matching rows
                </td>
              </tr>
            ) : (
              pagedRows.map((row, ri) => (
                <tr
                  key={ri}
                  className="proof-tr"
                  onClick={() => onRowClick?.(row)}
                  style={{
                    cursor: onRowClick ? "pointer" : undefined,
                  }}
                >
                  {columns.map((col) => {
                    const val = row[col.field];
                    return (
                      <td key={col.field} className="proof-td">
                        {col.format ? col.format(val) : String(val ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
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
