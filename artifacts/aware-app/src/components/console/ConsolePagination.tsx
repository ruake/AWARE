import React, { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface ConsolePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  showTotal?: boolean;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 0",
  borderTop: "1px solid var(--proof-border)",
  flexWrap: "wrap",
  gap: 8,
};

const infoStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--proof-text-secondary)",
  whiteSpace: "nowrap",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
};

const selectStyle: React.CSSProperties = {
  height: 28,
  fontSize: 12,
  background: "var(--proof-surface)",
  border: "1px solid var(--proof-border)",
  borderRadius: 4,
  color: "var(--proof-text)",
  padding: "0 4px",
  cursor: "pointer",
  outline: "none",
  fontFamily: "var(--font-sans)",
};

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    minWidth: 28,
    height: 28,
    borderRadius: 4,
    border: "1px solid var(--proof-border)",
    background: "transparent",
    color: "var(--proof-text)",
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 1px",
    padding: "0 6px",
    opacity: disabled ? 0.3 : 1,
    transition: "all var(--proof-transition)",
    fontFamily: "var(--font-sans)",
  };
}

const activePageBtnStyle: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  borderRadius: 4,
  border: "1px solid var(--proof-blue)",
  background: "var(--proof-blue)",
  color: "#fff",
  fontSize: 12,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 1px",
  padding: "0 6px",
  fontWeight: 600,
  fontFamily: "var(--font-sans)",
};

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  const delta = 2;

  pages.push(1);

  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("ellipsis");

  pages.push(total);

  return pages;
}

export function ConsolePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showTotal = true,
}: ConsolePaginationProps) {
  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalItems);

  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, totalPages),
    [currentPage, totalPages],
  );

  if (totalPages <= 0) return null;

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {showTotal && (
          <span style={infoStyle}>
            Showing {first}–{last} of {totalItems.toLocaleString()} items
          </span>
        )}

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={selectStyle}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div style={navStyle}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          style={pageBtnStyle(currentPage <= 1)}
          title="First page"
          onMouseEnter={(e) => {
            if (currentPage > 1)
              e.currentTarget.style.background = "var(--proof-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronsLeft style={{ width: 14, height: 14 }} />
        </button>

        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={pageBtnStyle(currentPage <= 1)}
          title="Previous page"
          onMouseEnter={(e) => {
            if (currentPage > 1)
              e.currentTarget.style.background = "var(--proof-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
        </button>

        {visiblePages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                minWidth: 20,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "var(--proof-text-muted)",
                userSelect: "none",
              }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={p === currentPage ? activePageBtnStyle : pageBtnStyle(false)}
              onMouseEnter={(e) => {
                if (p !== currentPage)
                  e.currentTarget.style.background = "var(--proof-surface-hover)";
              }}
              onMouseLeave={(e) => {
                if (p !== currentPage)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {p}
            </button>
          ),
        )}

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={pageBtnStyle(currentPage >= totalPages)}
          title="Next page"
          onMouseEnter={(e) => {
            if (currentPage < totalPages)
              e.currentTarget.style.background = "var(--proof-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          style={pageBtnStyle(currentPage >= totalPages)}
          title="Last page"
          onMouseEnter={(e) => {
            if (currentPage < totalPages)
              e.currentTarget.style.background = "var(--proof-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronsRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
