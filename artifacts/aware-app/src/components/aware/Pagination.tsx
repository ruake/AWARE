import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const btnBase: React.CSSProperties = {
  background: "var(--proof-subtle-bg2)",
  border: "1px solid var(--proof-border-strong)",
  color: "var(--proof-text-secondary)",
  borderRadius: 4,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.35,
  cursor: "not-allowed",
  pointerEvents: "none",
};

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [];
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  pages.push(1);
  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("ellipsis");
  if (total > 1) pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "8px 0",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
          aria-disabled={currentPage <= 1 ? "true" : "false"}
          style={{
            ...btnBase,
            padding: "3px 8px",
            fontSize: 11,
            ...(currentPage <= 1 ? btnDisabled : {}),
          }}
        >
          First
        </button>

        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          aria-disabled={currentPage <= 1 ? "true" : "false"}
          style={{
            ...btnBase,
            padding: "3px 8px",
            fontSize: 11,
            ...(currentPage <= 1 ? btnDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = "var(--proof-surface-hover)";
              e.currentTarget.style.borderColor = "var(--proof-border-accent)";
              e.currentTarget.style.color = "var(--proof-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = "var(--proof-subtle-bg2)";
              e.currentTarget.style.borderColor = "var(--proof-border-strong)";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }
          }}
        >
          Prev
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "0 8px" }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--proof-text-secondary)",
            }}
          >
            Page{" "}
            <span 
              aria-current="page"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
            >
              {currentPage}
            </span> of{" "}
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{totalPages}</span>
          </span>
        </div>

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          aria-disabled={currentPage >= totalPages ? "true" : "false"}
          style={{
            ...btnBase,
            padding: "3px 8px",
            fontSize: 11,
            ...(currentPage >= totalPages ? btnDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = "var(--proof-surface-hover)";
              e.currentTarget.style.borderColor = "var(--proof-border-accent)";
              e.currentTarget.style.color = "var(--proof-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = "var(--proof-subtle-bg2)";
              e.currentTarget.style.borderColor = "var(--proof-border-strong)";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }
          }}
        >
          Next
        </button>

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
          aria-disabled={currentPage >= totalPages ? "true" : "false"}
          style={{
            ...btnBase,
            padding: "3px 8px",
            fontSize: 11,
            ...(currentPage >= totalPages ? btnDisabled : {}),
          }}
        >
          Last
        </button>
      </div>

      <span
        style={{
          fontSize: 11,
          color: "var(--proof-text-muted)",
          fontFamily: "var(--font-mono)",
          marginLeft: 12,
        }}
      >
        Showing {startItem}–{endItem} of {totalItems}
      </span>
    </nav>
  );
}
