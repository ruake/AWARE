import React from "react";
import { PanelErrorBoundary } from "./PanelErrorBoundary";
import { Pagination } from "./Pagination";
import { SkeletonTable } from "./Skeleton";
import { SlidersHorizontal, AlertTriangle } from "lucide-react";

interface PageTemplateProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  badges?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  loadingCols?: number;
  loadingSkeleton?: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  topContent?: React.ReactNode;
  error?: Error | null;
  errorLabel?: string;
  sidePanel?: React.ReactNode;
  sidePanelWidth?: number;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function PageTemplate({
  title,
  subtitle,
  headerActions,
  badges,
  filters,
  children,
  loading = false,
  loadingRows = 5,
  loadingCols = 4,
  loadingSkeleton,
  isEmpty = false,
  emptyMessage,
  emptyAction,
  topContent,
  error = null,
  errorLabel,
  sidePanel,
  sidePanelWidth = 440,
  currentPage,
  totalPages,
  totalItems,
  pageSize = 25,
  onPageChange,
}: PageTemplateProps) {
  const showPagination =
    currentPage !== undefined &&
    totalPages !== undefined &&
    totalItems !== undefined &&
    onPageChange;

  return (
    <div className="proof-page" style={{ animation: "page-enter 0.3s cubic-bezier(0.2, 0, 0.2, 1) both" }}>
      <div
        className="proof-page-header"
        style={{
          padding: "24px 32px",
          borderBottom: "1px solid var(--proof-border)",
          background: "rgba(0,0,0,0.1)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1
              className="proof-page-title"
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--proof-text)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
            {badges}
          </div>
          {subtitle && (
            <p
              className="proof-page-subtitle"
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "var(--proof-text-secondary)",
                margin: "4px 0 0",
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

      {filters && (
        <div
          style={{
            padding: "12px 32px",
            borderBottom: "1px solid var(--proof-border-light)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "nowrap",
            overflowX: "auto",
            background: "var(--proof-surface-2)",
          }}
        >
          {filters}
        </div>
      )}

      {topContent && (
        <div
          style={{
            borderBottom: "1px solid var(--proof-border)",
            flexShrink: 0,
            background: "var(--proof-surface)",
          }}
        >
          {topContent}
        </div>
      )}

      <div
        className="proof-page-content"
        style={{
          display: "flex",
          gap: 0,
          padding: sidePanel ? "0" : "24px 32px 32px",
        }}
      >
        <PanelErrorBoundary label={errorLabel ?? title}>
          {loading ? (
            (loadingSkeleton ?? <SkeletonTable rows={loadingRows} cols={loadingCols} />)
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 200,
                gap: 8,
                color: "var(--proof-text-muted)",
                fontSize: 13,
              }}
            >
              <AlertTriangle size={20} style={{ opacity: 0.4 }} />
              <span>{error.message}</span>
            </div>
          ) : isEmpty ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 200,
                gap: 8,
                color: "var(--proof-text-muted)",
                fontSize: 13,
              }}
            >
              <SlidersHorizontal size={20} style={{ opacity: 0.4 }} />
              {emptyMessage && <span>{emptyMessage}</span>}
              {emptyAction}
            </div>
          ) : sidePanel ? (
            <div style={{ flex: 1, display: "flex", gap: 0, minHeight: 0 }}>
              <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>{children}</div>
              <div
                style={{
                  width: sidePanelWidth,
                  flexShrink: 0,
                  borderLeft: "1px solid var(--proof-border)",
                  overflow: "auto",
                }}
              >
                {sidePanel}
              </div>
            </div>
          ) : (
            children
          )}
        </PanelErrorBoundary>
      </div>

      {showPagination && totalPages > 1 && (
        <div
          style={{
            padding: "8px 20px",
            borderTop: "1px solid var(--proof-border)",
            flexShrink: 0,
            background: "var(--proof-surface)",
          }}
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
