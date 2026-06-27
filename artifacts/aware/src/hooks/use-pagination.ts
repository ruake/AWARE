import { useState, useEffect } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 whenever the source list changes (filter / search)
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  /** Page numbers to render, with -1 as an ellipsis sentinel */
  function pageRange(): number[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (page > 3) pages.push(-1);
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < totalPages - 2) pages.push(-1);
    pages.push(totalPages);
    return pages;
  }

  return {
    page,
    setPage,
    totalPages,
    pageItems,
    pageRange,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, items.length),
    total: items.length,
  };
}
