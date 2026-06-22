import React from "react";
import { ConsolePagination } from "./ConsolePagination";

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
  accentColor?: string;
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
  accentColor = "var(--proof-blue)",
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
        animation: "page-enter 0.2s ease-out both",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "24px 32px",
          flexShrink: 0,
          borderBottom: "1px solid var(--proof-border)",
          background: "rgba(0,0,0,0.1)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          position: "relative",
        }}
      >
        {/* Left accent line */}
        <div
          style={{
            position: "absolute",
            bottom: -1,
            left: 32,
            width: 48,
            height: 2,
            borderRadius: 99,
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
            zIndex: 1,
          }}
        />

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--proof-text)",
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 13,
                color: "var(--proof-text-secondary)",
                margin: "4px 0 0",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {headerActions && (
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
            {headerActions}
          </div>
        )}
      </div>

      {/* Filters */}
      {filters && (
        <div
          style={{
            padding: "12px 32px",
            flexShrink: 0,
            borderBottom: "1px solid var(--proof-border-light)",
            background: "var(--proof-surface-2)",
          }}
        >
          {filters}
        </div>
      )}

      {/* Top pagination */}
      {hasPaginationTop && (
        <div style={{ padding: "12px 32px 0", flexShrink: 0 }}>{renderPagination()}</div>
      )}

      {/* Content area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px 32px 32px",
        }}
      >
        {children}
      </div>

      {/* Bottom pagination */}
      {hasPaginationBottom && (
        <div style={{ padding: "0 32px 24px", flexShrink: 0 }}>{renderPagination()}</div>
      )}
    </div>
  );
}
