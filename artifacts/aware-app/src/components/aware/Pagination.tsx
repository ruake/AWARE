import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const btnBase: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--proof-text-secondary)",
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s ease",
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

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  totalItems: _totalItems,
  pageSize: _pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageNumbers(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "16px 0",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--proof-surface-2)", padding: 4, borderRadius: 8, border: "1px solid var(--proof-border)" }}>
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
          style={{
            ...btnBase,
            width: 32,
            height: 32,
            ...(currentPage <= 1 ? btnDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = "var(--proof-surface-hover)";
              e.currentTarget.style.color = "var(--proof-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }
          }}
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          style={{
            ...btnBase,
            width: 32,
            height: 32,
            ...(currentPage <= 1 ? btnDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = "var(--proof-surface-hover)";
              e.currentTarget.style.color = "var(--proof-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: "var(--proof-border)", margin: "0 4px" }} />

        {pages.map((p, i) => {
          if (p === "ellipsis") {
            return <span key={`ell-${i}`} style={{ color: "var(--proof-text-muted)", padding: "0 8px" }}>...</span>;
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={isActive ? "page" : undefined}
              style={{
                ...btnBase,
                width: 32,
                height: 32,
                background: isActive ? "var(--proof-blue)" : "transparent",
                color: isActive ? "#fff" : "var(--proof-text-secondary)",
                boxShadow: isActive ? "0 0 12px rgba(0, 196, 255, 0.4)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--proof-surface-hover)";
                  e.currentTarget.style.color = "var(--proof-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--proof-text-secondary)";
                }
              }}
            >
              {p}
            </button>
          );
        })}

        <div style={{ width: 1, height: 20, background: "var(--proof-border)", margin: "0 4px" }} />

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          style={{
            ...btnBase,
            width: 32,
            height: 32,
            ...(currentPage >= totalPages ? btnDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = "var(--proof-surface-hover)";
              e.currentTarget.style.color = "var(--proof-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }
          }}
        >
          <ChevronRight size={16} />
        </button>

        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
          style={{
            ...btnBase,
            width: 32,
            height: 32,
            ...(currentPage >= totalPages ? btnDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = "var(--proof-surface-hover)";
              e.currentTarget.style.color = "var(--proof-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }
          }}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  );
}
