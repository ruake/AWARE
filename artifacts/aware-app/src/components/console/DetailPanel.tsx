import React from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from "lucide-react";

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
  footer?: React.ReactNode;
  width?: string;
  maxWidth?: string;
}

const BACKDROP_CSS: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9998,
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  animation: "fadeIn 0.15s ease",
};

const PANEL_CSS: React.CSSProperties = {
  background: "rgba(9, 13, 20, 0.85)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(0,196,255,0.2)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.6), var(--proof-glow-cyan)",
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  animation: "scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.05)",
  maxHeight: "85vh",
};

const HEADER_CSS: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "16px 20px",
  borderBottom: "1px solid var(--proof-border)",
  flexShrink: 0,
  minHeight: 56,
  background: "rgba(255,255,255,0.03)",
};

const NAV_BTN: React.CSSProperties = {
  border: "1px solid var(--proof-border)",
  background: "transparent",
  borderRadius: 4,
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--proof-text-secondary)",
  flexShrink: 0,
  padding: 0,
  transition: "all 0.1s",
};

const BODY_CSS: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
};

const FOOTER_CSS: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderTop: "1px solid var(--proof-border)",
  flexShrink: 0,
};

export function DetailPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
  expanded,
  onToggleExpand,
  footer,
  width = "640px",
  maxWidth = "90vw",
}: DetailPanelProps) {
  if (!open) return null;

  return (
    <div
      style={BACKDROP_CSS}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{
          ...PANEL_CSS,
          width: expanded ? "90vw" : width,
          maxWidth: expanded ? "96vw" : maxWidth,
          maxHeight: expanded ? "95vh" : "85vh",
        }}
      >
        {/* Header */}
        <div style={HEADER_CSS}>
          {onPrev && (
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              style={{
                ...NAV_BTN,
                opacity: hasPrev ? 1 : 0.3,
                cursor: hasPrev ? "pointer" : "not-allowed",
              }}
              title="Previous"
              onMouseEnter={(e) => {
                if (hasPrev) {
                  e.currentTarget.style.background = "var(--proof-hover)";
                  e.currentTarget.style.color = "var(--proof-text)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--proof-text-secondary)";
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={!hasNext}
              style={{
                ...NAV_BTN,
                opacity: hasNext ? 1 : 0.3,
                cursor: hasNext ? "pointer" : "not-allowed",
              }}
              title="Next"
              onMouseEnter={(e) => {
                if (hasNext) {
                  e.currentTarget.style.background = "var(--proof-hover)";
                  e.currentTarget.style.color = "var(--proof-text)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--proof-text-secondary)";
              }}
            >
              <ChevronRight size={14} />
            </button>
          )}
          {currentIndex !== undefined && totalCount !== undefined && (
            <span
              style={{
                fontSize: 11,
                color: "var(--proof-text-muted)",
                fontFamily: "var(--font-mono)",
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              {currentIndex}/{totalCount}
            </span>
          )}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginLeft: 8,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--proof-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                letterSpacing: "0.5px"
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--proof-blue)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  fontFamily: "var(--font-mono)"
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              style={{
                ...NAV_BTN,
                color: expanded ? "var(--proof-blue)" : "var(--proof-text-secondary)",
              }}
              title={expanded ? "Minimize" : "Expand"}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--proof-hover)";
                if (!expanded) e.currentTarget.style.color = "var(--proof-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                if (!expanded) e.currentTarget.style.color = "var(--proof-text-secondary)";
              }}
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              ...NAV_BTN,
              marginLeft: 2,
            }}
            title="Close"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--proof-hover)";
              e.currentTarget.style.color = "var(--proof-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--proof-text-secondary)";
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={BODY_CSS}>{children}</div>

        {/* Footer */}
        {footer && <div style={FOOTER_CSS}>{footer}</div>}
      </div>
    </div>
  );
}
