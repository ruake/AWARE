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
    onPageChange !== undefined;

  return (
    <div className="proof-page animate-fade-in" style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        className="proof-page-header"
        style={{
          padding: "32px 40px",
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-surface)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <h1
              className="proof-page-title"
              style={{
                fontSize: 24,
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
                fontSize: 14,
                color: "var(--proof-text-secondary)",
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        {headerActions && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {headerActions}
          </div>
        )}
      </div>

      {/* Filters */}
      {filters && (
        <div
          style={{
            padding: "16px 40px",
            borderBottom: "1px solid var(--proof-border-light)",
            background: "var(--proof-surface-2)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexShrink: 0,
            overflowX: "auto",
          }}
        >
          {filters}
        </div>
      )}

      {/* Top Content */}
      {topContent && (
        <div
          style={{
            borderBottom: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            flexShrink: 0,
          }}
        >
          {topContent}
        </div>
      )}

      {/* Main Content Area */}
      <div
        className="proof-page-content"
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
          padding: sidePanel ? 0 : "32px 40px",
        }}
      >
        <PanelErrorBoundary label={errorLabel ?? title}>
          {loading ? (
            <div style={{ width: "100%", padding: sidePanel ? "32px 40px" : 0 }}>
              {loadingSkeleton ?? <SkeletonTable rows={loadingRows} cols={loadingCols} />}
            </div>
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                gap: 16,
                color: "var(--proof-text-muted)",
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--proof-red-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} style={{ color: "var(--proof-red)" }} />
              </div>
              <span style={{ fontSize: 14 }}>{error.message}</span>
            </div>
          ) : isEmpty ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                gap: 16,
                color: "var(--proof-text-muted)",
                background: "var(--proof-subtle-bg)",
                borderRadius: "var(--proof-radius-lg)",
                border: "1px dashed var(--proof-border-strong)",
              }}
            >
              <SlidersHorizontal size={32} style={{ opacity: 0.5 }} />
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                {emptyMessage && <span style={{ fontSize: 15, fontWeight: 500, color: "var(--proof-text)" }}>{emptyMessage}</span>}
                {emptyAction}
              </div>
            </div>
          ) : sidePanel ? (
            <div style={{ display: "flex", width: "100%", height: "100%" }}>
              <div style={{ flex: 1, minWidth: 0, overflow: "auto", padding: "32px 40px" }}>
                {children}
              </div>
              <div
                style={{
                  width: sidePanelWidth,
                  flexShrink: 0,
                  borderLeft: "1px solid var(--proof-border)",
                  background: "var(--proof-surface-2)",
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

      {/* Pagination Footer */}
      {showPagination && totalPages > 1 && !loading && !error && !isEmpty && (
        <div
          style={{
            padding: "16px 40px",
            borderTop: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
