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
          padding: "18px 24px 14px",
          flexShrink: 0,
          borderBottom: "1px solid var(--proof-border)",
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          position: "relative",
        }}
      >
        {/* Left accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 24,
            width: 40,
            height: 2,
            borderRadius: 99,
            background: accentColor,
            opacity: 0.6,
          }}
        />

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: "var(--proof-text)",
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                margin: "3px 0 0",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {headerActions && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
            {headerActions}
          </div>
        )}
      </div>

      {/* Filters */}
      {filters && (
        <div
          style={{
            padding: "10px 24px",
            flexShrink: 0,
            borderBottom: "1px solid var(--proof-border-light)",
            background: "rgba(0,0,0,0.08)",
          }}
        >
          {filters}
        </div>
      )}

      {/* Top pagination */}
      {hasPaginationTop && (
        <div style={{ padding: "8px 24px 0", flexShrink: 0 }}>{renderPagination()}</div>
      )}

      {/* Content area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px 24px 24px",
        }}
      >
        {children}
      </div>

      {/* Bottom pagination */}
      {hasPaginationBottom && (
        <div style={{ padding: "0 24px 16px", flexShrink: 0 }}>{renderPagination()}</div>
      )}
    </div>
  );
}
