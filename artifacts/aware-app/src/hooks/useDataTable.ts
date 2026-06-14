import { useMemo, useState, useCallback } from "react";

function getNestedValue<T extends Record<string, unknown>>(obj: T, key: string): unknown {
  const parts = key.split(".");
  let value: unknown = obj;
  for (const part of parts) {
    if (value == null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function matchesSearch<T extends Record<string, unknown>>(item: T, query: string): boolean {
  if (!query) return true;
  const lower = query.toLowerCase();
  return Object.values(item).some((value) => {
    if (value == null) return false;
    return String(value).toLowerCase().includes(lower);
  });
}

function matchesFilter<T extends Record<string, unknown>>(
  item: T,
  key: string,
  value: string,
): boolean {
  if (!value) return true;
  const cellValue = getNestedValue(item, key);
  if (cellValue == null) return false;
  return String(cellValue).toLowerCase().includes(value.toLowerCase());
}

interface UseDataTableOptions {
  defaultSort?: { key: string; direction: "asc" | "desc" };
  defaultPageSize?: number;
  defaultFilters?: Record<string, string>;
}

interface UseDataTableReturn<T> {
  page: number;
  pageSize: number;
  sortKey: string | null;
  sortDirection: "asc" | "desc" | null;
  filters: Record<string, string>;
  searchQuery: string;
  sortedData: T[];
  paginatedData: T[];
  totalPages: number;
  totalFiltered: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setSort: (key: string) => void;
  setFilter: (key: string, value: string) => void;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
}

export function useDataTable<T extends Record<string, unknown>>(
  data: T[],
  options?: UseDataTableOptions,
): UseDataTableReturn<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options?.defaultPageSize ?? 25);
  const [sortKey, setSortKey] = useState<string | null>(options?.defaultSort?.key ?? null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    options?.defaultSort?.direction ?? null,
  );
  const [filters, setFilterRaw] = useState<Record<string, string>>(options?.defaultFilters ?? {});
  const [searchQuery, setSearchQuery] = useState("");

  const setFilter = useCallback((key: string, value: string) => {
    setFilterRaw((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilterRaw({});
    setSearchQuery("");
    setPage(1);
  }, []);

  const setSort = useCallback(
    (key: string) => {
      setPage(1);
      setSortKey((prevKey) => {
        if (prevKey !== key) {
          setSortDirection("asc");
          return key;
        }
        setSortDirection((prevDir) => {
          if (prevDir === null) return "asc";
          if (prevDir === "asc") return "desc";
          return null;
        });
        return key;
      });
    },
    [],
  );

  const filtered = useMemo(() => {
    let result = data;

    if (searchQuery) {
      result = result.filter((item) => matchesSearch(item, searchQuery));
    }

    const activeFilters = Object.entries(filters).filter(([, v]) => v);
    if (activeFilters.length > 0) {
      result = result.filter((item) =>
        activeFilters.every(([key, value]) => matchesFilter(item, key, value)),
      );
    }

    return result;
  }, [data, searchQuery, filters]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      } else if (aVal instanceof Date && bVal instanceof Date) {
        cmp = aVal.getTime() - bVal.getTime();
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDirection]);

  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  return {
    page: safePage,
    pageSize,
    sortKey,
    sortDirection,
    filters,
    searchQuery,
    sortedData: sorted,
    paginatedData,
    totalPages,
    totalFiltered,
    setPage,
    setPageSize: (s: number) => {
      setPageSize(s);
      setPage(1);
    },
    setSort,
    setFilter,
    setSearchQuery: (q: string) => {
      setSearchQuery(q);
      setPage(1);
    },
    resetFilters,
  };
}
