import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width, height = 16, className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--gcp-surface)] ${className}`}
      style={{ width, height }}
    />
  );
}

interface CardSkeleton {
  lines?: number;
}

export function CardSkeleton({ lines = 3 }: CardSkeleton) {
  return (
    <div className="gcp-card p-4 space-y-3">
      <Skeleton width="60%" height={20} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${70 + (i * 10) % 30}%`} height={14} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 pb-2 border-b border-[var(--gcp-border)]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${80 / cols}%`} height={14} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${80 / cols}%`} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="gcp-card p-4">
      <Skeleton width="40%" height={18} className="mb-4" />
      <Skeleton width="100%" height={200} />
    </div>
  );
}
