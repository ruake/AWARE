import React from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export interface TourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function Tour({ steps, onComplete, onSkip }: TourProps) {
  const [current, setCurrent] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  React.useEffect(() => {
    const el = document.querySelector(step.target);
    if (!el) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        setRect(null);
        return;
      }
      setRect(r);
    };

    updateRect();
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const observer = new ResizeObserver(updateRect);
    observer.observe(el);
    window.addEventListener("scroll", updateRect, { passive: true });
    window.addEventListener("resize", updateRect);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateRect);
      window.removeEventListener("resize", updateRect);
    };
  }, [current, step.target]);

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const goBack = () => {
    setCurrent((c) => Math.max(0, c - 1));
  };

  const tooltipStyle: React.CSSProperties = {};
  const gap = 14;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  if (rect) {
    const placement = step.placement ?? "bottom";
    const tooltipW = 320;
    const tooltipH = 200;

    switch (placement) {
      case "top": {
        const left = clamp(rect.left + rect.width / 2, tooltipW / 2 + 8, viewportW - tooltipW / 2 - 8);
        tooltipStyle.left = left;
        tooltipStyle.top = clamp(rect.top - tooltipH - gap, 8, viewportH - tooltipH - 8);
        tooltipStyle.transform = "translateX(-50%)";
        break;
      }
      case "bottom": {
        const left = clamp(rect.left + rect.width / 2, tooltipW / 2 + 8, viewportW - tooltipW / 2 - 8);
        tooltipStyle.left = left;
        tooltipStyle.top = clamp(rect.bottom + gap, 8, viewportH - tooltipH - 8);
        tooltipStyle.transform = "translateX(-50%)";
        break;
      }
      case "left": {
        const top = clamp(rect.top + rect.height / 2, tooltipH / 2 + 8, viewportH - tooltipH / 2 - 8);
        tooltipStyle.top = top;
        tooltipStyle.left = clamp(rect.left - tooltipW - gap, 8, viewportW - tooltipW - 8);
        tooltipStyle.transform = "translateY(-50%)";
        break;
      }
      case "right": {
        const top = clamp(rect.top + rect.height / 2, tooltipH / 2 + 8, viewportH - tooltipH / 2 - 8);
        tooltipStyle.top = top;
        tooltipStyle.left = clamp(rect.right + gap, 8, viewportW - tooltipW - 8);
        tooltipStyle.transform = "translateY(-50%)";
        break;
      }
    }
  }

  return createPortal(
    <>
      {/* Overlay backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          background: "var(--proof-overlay)",
          animation: "fade-in 200ms ease-out",
        }}
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Cutout highlight */}
      {rect && (
        <div
          style={{
            position: "fixed",
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            zIndex: 9998,
            borderRadius: "var(--proof-radius-md)",
            boxShadow: "0 0 0 9999px var(--proof-overlay), 0 0 0 2px var(--proof-blue), 0 0 20px var(--proof-blue-glow)",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-label={`Tour step ${current + 1}: ${step.title}`}
        style={{
          position: "fixed",
          zIndex: 9999,
          width: 320,
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border-strong)",
          borderRadius: "var(--proof-radius-lg)",
          boxShadow: "var(--proof-shadow-lg), 0 0 30px var(--proof-blue-glow)",
          animation: "scale-in 200ms ease-out",
          overflow: "hidden",
          ...tooltipStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator + close */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid var(--proof-border-light)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--proof-text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Step {current + 1} / {steps.length}
          </span>
          <button
            onClick={onSkip}
            aria-label="Skip tour"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--proof-text-muted)",
              padding: 4,
              display: "flex",
              borderRadius: "var(--proof-radius-sm)",
              transition: "color var(--proof-transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Title + content */}
        <div style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--proof-text)",
              marginBottom: 6,
              letterSpacing: "-0.01em",
            }}
          >
            {step.title}
          </div>
          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.6,
              color: "var(--proof-text-secondary)",
            }}
          >
            {step.content}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            borderTop: "1px solid var(--proof-border-light)",
          }}
        >
          <button
            onClick={onSkip}
            className="proof-btn proof-btn-ghost"
            style={{ fontSize: 11, padding: "4px 8px", fontWeight: 600 }}
          >
            Skip
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            {!isFirst && (
              <button
                onClick={goBack}
                className="proof-btn proof-btn-ghost"
                style={{ fontSize: 11, padding: "4px 8px", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}
              >
                <ChevronLeft size={13} /> Back
              </button>
            )}
            <button
              onClick={goNext}
              className="proof-btn proof-btn-primary"
              style={{ fontSize: 11, padding: "4px 12px", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}
            >
              {isLast ? "Finish" : "Next"} {!isLast && <ChevronRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
