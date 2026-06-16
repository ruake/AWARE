import React from "react";
import { ConsolePagination } from "./ConsolePagination";
import { ConsoleCard } from "./ConsoleCard";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  filters?: React.ReactNode;
  headerActions?: React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  maxWidth?: string;
  pagination?: "top" | "bottom" | "both";
}

export function PageShell({
  title,
  subtitle,
  children,
  filters,
  headerActions,
  currentPage,
  totalPages,
  totalItems,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  maxWidth = "1600px",
  pagination,
}: PageShellProps) {
  const showPagination =
    pagination &&
    currentPage !== undefined &&
    totalPages !== undefined &&
    totalItems !== undefined &&
    onPageChange;

  const hasPaginationTop = showPagination && (pagination === "top" || pagination === "both");
  const hasPaginationBottom = showPagination && (pagination === "bottom" || pagination === "both");

  const renderPagination = () =>
    showPagination ? (
      <ConsolePagination
        currentPage={currentPage!}
        totalPages={totalPages!}
        totalItems={totalItems!}
        pageSize={pageSize}
        onPageChange={onPageChange!}
        onPageSizeChange={onPageSizeChange ?? (() => {})}
        pageSizeOptions={pageSizeOptions}
      />
    ) : null;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px 0",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--proof-text)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                margin: "2px 0 0",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {headerActions && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{headerActions}</div>
        )}
      </div>

      {/* Filters */}
      {filters && (
        <div
          style={{
            padding: "12px 20px 0",
            flexShrink: 0,
          }}
        >
          {filters}
        </div>
      )}

      {/* Top pagination */}
      {hasPaginationTop && (
        <div style={{ padding: "8px 20px 0", flexShrink: 0 }}>{renderPagination()}</div>
      )}

      {/* Content area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 20px 20px",
        }}
      >
        {children}
      </div>

      {/* Bottom pagination */}
      {hasPaginationBottom && (
        <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>{renderPagination()}</div>
      )}
    </div>
  );
}
