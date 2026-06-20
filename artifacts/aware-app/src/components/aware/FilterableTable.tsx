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
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text-secondary)" }}>
          {title}
        </div>
      )}
      {/* Filters row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <input
          className="proof-input"
          style={{ width: 200, fontSize: 11, padding: "4px 8px" }}
          placeholder={searchPlaceholder}
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        {columns
          .filter((c) => c.filterType === "select" && c.options && c.options.length > 0)
          .map((col) => (
            <select
              key={col.field}
              className="proof-input"
              style={{ fontSize: 11, padding: "4px 8px", width: "auto" }}
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
            onClick={() => setFilters({})}
            style={{
              fontSize: 11,
              color: "var(--proof-red)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {/* HTML table with sort */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          borderRadius: 8,
          border: "1px solid var(--proof-border)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr
              style={{
                background: "var(--proof-grey-bg)",
                fontWeight: 600,
                position: "sticky",
                top: 0,
              }}
            >
              {columns.map((col, i) => (
                <th
                  key={col.field}
                  onClick={() => toggleSort(i)}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid var(--proof-border)",
                    color: "var(--proof-text)",
                    userSelect: "none",
                  }}
                >
                  {col.label}
                  {sortCol === i ? (sortAsc ? " \u25B2" : " \u25BC") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: "var(--proof-text-muted)",
                  }}
                >
                  No matching rows
                </td>
              </tr>
            ) : (
              pagedRows.map((row, ri) => (
                <tr
                  key={ri}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    background: ri % 2 === 0 ? "transparent" : "var(--proof-grey-bg)",
                    cursor: onRowClick ? "pointer" : undefined,
                  }}
                >
                  {columns.map((col) => {
                    const val = row[col.field];
                    return (
                      <td
                        key={col.field}
                        style={{
                          padding: "4px 10px",
                          borderBottom: "1px solid var(--proof-border)",
                          color: "var(--proof-text)",
                        }}
                      >
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
        <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
          Showing {pagedRows.length} of {sortedRows.length} rows
        </span>
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{
                padding: "2px 8px",
                fontSize: 10,
                borderRadius: 4,
                border: "1px solid var(--proof-border)",
                background: "var(--proof-grey-bg)",
                cursor: page <= 0 ? "default" : "pointer",
                opacity: page <= 0 ? 0.4 : 1,
              }}
            >
              Prev
            </button>
            <span
              style={{ fontSize: 10, padding: "2px 6px", color: "var(--proof-text-secondary)" }}
            >
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              style={{
                padding: "2px 8px",
                fontSize: 10,
                borderRadius: 4,
                border: "1px solid var(--proof-border)",
                background: "var(--proof-grey-bg)",
                cursor: page >= totalPages - 1 ? "default" : "pointer",
                opacity: page >= totalPages - 1 ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
