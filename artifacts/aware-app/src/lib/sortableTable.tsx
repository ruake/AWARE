import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUp, ArrowDown, Search } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: string;
  dir: SortDir;
}

export function useSort(initialKey: string, initialDir: SortDir = 'desc') {
  const [sort, setSort] = useState<SortState>({ key: initialKey, dir: initialDir });
  const toggle = useCallback((key: string) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    );
  }, []);
  return { sort, toggle, setSort };
}

export function sortData<T>(data: T[], sort: SortState, accessors: Record<string, (item: T) => string | number>): T[] {
  return useMemo(() => {
    const fn = accessors[sort.key];
    if (!fn) return data;
    return [...data].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort.key, sort.dir, accessors]);
}

export function SortHeader({
  label,
  sortKey,
  currentSort,
  onToggle,
  filterValue,
  onFilterChange,
  filterPlaceholder,
  className,
}: {
  label: string;
  sortKey: string;
  currentSort: SortState;
  onToggle: (key: string) => void;
  filterValue?: string;
  onFilterChange?: (v: string) => void;
  filterPlaceholder?: string;
  className?: string;
}) {
  const active = currentSort.key === sortKey;
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted ${className ?? ''}`}>
      <button
        onClick={() => onToggle(sortKey)}
        className="flex items-center gap-1.5 hover:text-gcp-text transition-colors group"
      >
        <span>{label}</span>
        <span className="text-gcp-text-muted/50 group-hover:text-gcp-text-muted transition-colors">
          {active ? (
            currentSort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
          ) : (
            <ArrowUp size={12} className="opacity-0 group-hover:opacity-40" />
          )}
        </span>
      </button>
      {onFilterChange && (
        <div className="relative mt-1.5">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gcp-text-muted/60" />
          <input
            type="text"
            value={filterValue ?? ''}
            onChange={e => onFilterChange(e.target.value)}
            placeholder={filterPlaceholder ?? `Filter ${label.toLowerCase()}…`}
            onClick={e => e.stopPropagation()}
            className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-[11px] rounded pl-6 pr-2 py-1 placeholder:text-gcp-text-muted/50 focus:outline-none focus:border-gcp-blue/50 transition-colors"
          />
        </div>
      )}
    </th>
  );
}

export function FilterHeader({
  label,
  filterValue,
  onFilterChange,
  filterPlaceholder,
  children,
}: {
  label: string;
  filterValue?: string;
  onFilterChange?: (v: string) => void;
  filterPlaceholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gcp-text-muted">
      <span>{label}</span>
      {children}
      {onFilterChange && (
        <div className="relative mt-1.5">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gcp-text-muted/60" />
          <input
            type="text"
            value={filterValue ?? ''}
            onChange={e => onFilterChange(e.target.value)}
            placeholder={filterPlaceholder ?? `Filter ${label.toLowerCase()}…`}
            className="w-full bg-gcp-elevated border border-gcp-border-soft text-gcp-text text-[11px] rounded pl-6 pr-2 py-1 placeholder:text-gcp-text-muted/50 focus:outline-none focus:border-gcp-blue/50 transition-colors"
          />
        </div>
      )}
    </th>
  );
}
