import React, { useCallback, useRef, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { SkeletonBox } from "@/components/aware/Skeleton";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  cellStyle?: React.CSSProperties;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number;
  pageSizeOptions?: number[];
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  onSelectionChange?: (selected: T[]) => void;
  keyExtractor: (item: T) => string | number;

  sortKey?: string | null;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (key: string) => void;

  filters?: Record<string, string>;
  onFilter?: (key: string, value: string) => void;

  searchQuery?: string;
  onSearchQuery?: (q: string) => void;

  page?: number;
  totalPages?: number;
  totalFiltered?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const sortIconMap = {
  none: ArrowUpDown,
  asc: ArrowUp,
  desc: ArrowDown,
} as const;

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  const Icon = sortIconMap[direction ?? "none"];
  return (
    <Icon
      style={{
        width: 14,
        height: 14,
        marginLeft: 4,
        opacity: direction ? 1 : 0.5,
        color: direction ? "var(--proof-blue)" : undefined,
        flexShrink: 0,
      }}
    />
  );
}

const headerCellStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "var(--proof-text-secondary)",
  borderBottom: "1px solid var(--proof-border)",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  userSelect: "none",
  minWidth: 80,
};

const dataCellStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  color: "var(--proof-text)",
  borderBottom: "1px solid var(--proof-border)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 80,
};

const checkboxCellStyle: React.CSSProperties = {
  width: 48,
  minWidth: 48,
  maxWidth: 48,
  padding: "8px 12px",
  textAlign: "center",
  borderBottom: "1px solid var(--proof-border)",
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  sortable = true,
  filterable = false,
  searchable = false,
  selectable = false,
  loading = false,
  emptyMessage = "No data",
  onRowClick,
  onSelectionChange,
  keyExtractor,

  sortKey,
  sortDirection,
  onSort,

  filters,
  onFilter,

  searchQuery,
  onSearchQuery,

  page,
  totalPages,
  totalFiltered,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string | number>>(new Set());
  const lastClickedRef = useRef<string | number | null>(null);

  const selectableColumns = useMemo(() => {
    if (!selectable) return columns;
    return [
      {
        key: "__selection__",
        header: "",
        width: 48,
        sortable: false,
        filterable: false,
      } as ColumnDef<T>,
      ...columns,
    ];
  }, [selectable, columns]);

  const displayColumns = selectable ? selectableColumns : columns;

  const allSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.every((item) => selectedKeys.has(keyExtractor(item)));
  }, [data, selectedKeys, keyExtractor]);

  const someSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.some((item) => selectedKeys.has(keyExtractor(item))) && !allSelected;
  }, [data, selectedKeys, keyExtractor, allSelected]);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      const next = new Set(selectedKeys);
      data.forEach((item) => next.delete(keyExtractor(item)));
      setSelectedKeys(next);
      onSelectionChange?.([]);
    } else {
      const next = new Set(selectedKeys);
      data.forEach((item) => next.add(keyExtractor(item)));
      setSelectedKeys(next);
      onSelectionChange?.(data);
    }
  }, [allSelected, data, selectedKeys, keyExtractor, onSelectionChange]);

  const toggleItem = useCallback(
    (item: T, index: number, shiftKey: boolean) => {
      const id = keyExtractor(item);

      setSelectedKeys((prev) => {
        const next = new Set(prev);

        if (shiftKey && lastClickedRef.current !== null) {
          const lastIdx = data.findIndex(
            (d) => keyExtractor(d) === lastClickedRef.current,
          );
          if (lastIdx !== -1) {
            const start = Math.min(lastIdx, index);
            const end = Math.max(lastIdx, index);
            for (let i = start; i <= end; i++) {
              next.add(keyExtractor(data[i]));
            }
          }
        } else {
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }

        lastClickedRef.current = id;
        const selectedItems = data.filter((d) => next.has(keyExtractor(d)));
        onSelectionChange?.(selectedItems);
        return next;
      });
    },
    [data, keyExtractor, onSelectionChange],
  );

  const handleRowClick = useCallback(
    (item: T, index: number, e: React.MouseEvent) => {
      if (selectable) {
        toggleItem(item, index, e.shiftKey);
      }
      onRowClick?.(item);
    },
    [selectable, toggleItem, onRowClick],
  );

  const handleSort = useCallback(
    (col: ColumnDef<T>) => {
      if (!sortable || col.sortable === false) return;
      onSort?.(col.key);
    },
    [sortable, onSort],
  );

  const pageStart = page ? (page - 1) * (pageSize ?? 25) + 1 : 0;
  const pageEnd = page
    ? Math.min(page * (pageSize ?? 25), totalFiltered ?? 0)
    : 0;

  const arrowButtonStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--proof-border)",
    borderRadius: 4,
    color: "var(--proof-text-secondary)",
    cursor: "pointer",
    padding: "4px 8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    transition: "all var(--proof-transition)",
  };

  const pageButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "var(--proof-blue)" : "none",
    border: active ? "1px solid var(--proof-blue)" : "1px solid var(--proof-border)",
    borderRadius: 4,
    color: active ? "white" : "var(--proof-text-secondary)",
    cursor: "pointer",
    padding: "4px 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    transition: "all var(--proof-transition)",
  });

  const renderedPages = useMemo(() => {
    if (!totalPages) return [];
    const pages: (number | "ellipsis")[] = [];
    const delta = 2;
    const left = Math.max(2, (page ?? 1) - delta);
    const right = Math.min(totalPages - 1, (page ?? 1) + delta);

    pages.push(1);
    if (left > 2) pages.push("ellipsis");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }, [totalPages, page]);

  return (
    <div
      style={{
        border: "1px solid var(--proof-border)",
        borderRadius: 6,
        overflow: "hidden",
        background: "var(--proof-surface)",
      }}
    >
      {/* Search bar */}
      {searchable && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
          }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                color: "var(--proof-text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery ?? ""}
              onChange={(e) => onSearchQuery?.(e.target.value)}
              style={{
                width: "100%",
                height: 32,
                paddingLeft: 32,
                paddingRight: 10,
                fontSize: 13,
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: 4,
                color: "var(--proof-text)",
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--proof-blue)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(91, 138, 245, 0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--proof-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>
      )}

      {/* Table wrapper */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          {/* Header */}
          <thead>
            <tr style={{ background: "var(--proof-surface)" }}>
              {displayColumns.map((col) => {
                const isSortable = sortable && col.sortable !== false && col.key !== "__selection__";
                const align = col.align ?? "left";
                const width = col.width;

                return (
                  <th
                    key={col.key}
                    onClick={() => isSortable && handleSort(col)}
                    style={{
                      ...headerCellStyle,
                      textAlign: align,
                      cursor: isSortable ? "pointer" : "default",
                      width: width ?? undefined,
                      ...(col.key === "__selection__" ? checkboxCellStyle : {}),
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: align === "right" ? "flex-end" : "flex-start",
                        gap: 2,
                      }}
                    >
                      {col.key === "__selection__" ? (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={toggleAll}
                          style={{
                            accentColor: "var(--proof-blue)",
                            cursor: "pointer",
                            margin: 0,
                          }}
                        />
                      ) : (
                        <>
                          {col.header}
                          {isSortable && (
                            <SortIcon
                              direction={
                                sortKey === col.key ? (sortDirection ?? null) : null
                              }
                            />
                          )}
                        </>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>

            {/* Filter row */}
            {filterable && filters && onFilter && (
              <tr style={{ background: "var(--proof-grey-bg)" }}>
                {displayColumns.map((col) => (
                  <th
                    key={`filter-${col.key}`}
                    style={{
                      ...headerCellStyle,
                      padding: "6px 16px",
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                      background: "var(--proof-grey-bg)",
                      ...(col.key === "__selection__" ? checkboxCellStyle : {}),
                    }}
                  >
                    {col.key !== "__selection__" && col.filterable !== false && (
                      <input
                        type="text"
                        placeholder={`Filter ${col.header.toLowerCase()}...`}
                        value={filters[col.key] ?? ""}
                        onChange={(e) => onFilter(col.key, e.target.value)}
                        style={{
                          width: "100%",
                          height: 28,
                          fontSize: 12,
                          padding: "0 8px",
                          background: "var(--proof-grey-bg)",
                          border: "1px solid var(--proof-border)",
                          borderRadius: 3,
                          color: "var(--proof-text)",
                          outline: "none",
                          fontFamily: "var(--font-sans)",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "var(--proof-blue)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "var(--proof-border)";
                        }}
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize ?? 25, 10) }).map(
                (_, rowIdx) => (
                  <tr key={`skeleton-${rowIdx}`}>
                    {displayColumns.map((col, colIdx) => (
                      <td
                        key={`skeleton-cell-${rowIdx}-${colIdx}`}
                        style={dataCellStyle}
                      >
                        {col.key === "__selection__" ? null : (
                          <SkeletonBox width="80%" height={14} />
                        )}
                      </td>
                    ))}
                  </tr>
                ),
              )
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length}
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    color: "var(--proof-text-secondary)",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--proof-subtle-bg2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--proof-text-muted)",
                        fontSize: 18,
                      }}
                    >
                      <Search style={{ width: 18, height: 18 }} />
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--proof-text)" }}>
                      {emptyMessage}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const id = keyExtractor(item);
                const isSelected = selectedKeys.has(id);
                const isOdd = index % 2 === 1;

                return (
                  <tr
                    key={id}
                    onClick={(e) => handleRowClick(item, index, e)}
                    style={{
                      background: isSelected
                        ? "color-mix(in srgb, var(--proof-blue) 10%, transparent)"
                        : isOdd
                          ? "var(--proof-grey-bg)"
                          : "transparent",
                      cursor: onRowClick || selectable ? "pointer" : "default",
                      transition: "background var(--proof-transition)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background =
                          "var(--proof-surface-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isOdd
                          ? "var(--proof-grey-bg)"
                          : "transparent";
                      }
                    }}
                  >
                    {displayColumns.map((col) => {
                      const align = col.align ?? "left";

                      if (col.key === "__selection__") {
                        return (
                          <td key={col.key} style={checkboxCellStyle}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{
                                accentColor: "var(--proof-blue)",
                                cursor: "pointer",
                                margin: 0,
                              }}
                            />
                          </td>
                        );
                      }

                      const cellValue = col.render
                        ? col.render(item)
                        : String(item[col.key] ?? "");

                      return (
                        <td
                          key={col.key}
                          style={{
                            ...dataCellStyle,
                            textAlign: align,
                            ...col.cellStyle,
                          }}
                          title={
                            typeof cellValue === "string"
                              ? cellValue
                              : String(item[col.key] ?? "")
                          }
                        >
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages !== undefined && totalPages > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            borderTop: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            fontSize: 12,
            color: "var(--proof-text-secondary)",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {/* Left: page info */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>
              {pageStart}–{pageEnd} of {totalFiltered}
            </span>

            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                style={{
                  background: "var(--proof-grey-bg)",
                  border: "1px solid var(--proof-border)",
                  borderRadius: 3,
                  color: "var(--proof-text)",
                  fontSize: 12,
                  padding: "2px 6px",
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right: page controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              disabled={!page || page <= 1}
              onClick={() => onPageChange?.(1)}
              style={{
                ...arrowButtonStyle,
                opacity: page && page > 1 ? 1 : 0.4,
                cursor: page && page > 1 ? "pointer" : "not-allowed",
              }}
              title="First page"
            >
              <ChevronsLeft style={{ width: 14, height: 14 }} />
            </button>
            <button
              disabled={!page || page <= 1}
              onClick={() => onPageChange?.((page ?? 1) - 1)}
              style={{
                ...arrowButtonStyle,
                opacity: page && page > 1 ? 1 : 0.4,
                cursor: page && page > 1 ? "pointer" : "not-allowed",
              }}
              title="Previous page"
            >
              <ChevronLeft style={{ width: 14, height: 14 }} />
            </button>

            {renderedPages.map((p, i) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${i}`}
                  style={{
                    padding: "4px 4px",
                    color: "var(--proof-text-muted)",
                    fontSize: 12,
                  }}
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  style={pageButtonStyle(p === page)}
                >
                  {p}
                </button>
              ),
            )}

            <button
              disabled={!page || page >= (totalPages ?? 1)}
              onClick={() => onPageChange?.((page ?? 1) + 1)}
              style={{
                ...arrowButtonStyle,
                opacity: page && page < (totalPages ?? 1) ? 1 : 0.4,
                cursor:
                  page && page < (totalPages ?? 1) ? "pointer" : "not-allowed",
              }}
              title="Next page"
            >
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
            <button
              disabled={!page || page >= (totalPages ?? 1)}
              onClick={() => onPageChange?.(totalPages ?? 1)}
              style={{
                ...arrowButtonStyle,
                opacity: page && page < (totalPages ?? 1) ? 1 : 0.4,
                cursor:
                  page && page < (totalPages ?? 1) ? "pointer" : "not-allowed",
              }}
              title="Last page"
            >
              <ChevronsRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
