import React from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from "lucide-react";
import { AppError } from "@/lib/errorTypes";
import { navTo, repo } from "@/lib/nav";

interface ErrorFallbackProps {
  error: Error;
  retry?: () => void;
  onReset?: () => void;
  variant?: "page" | "panel";
  label?: string;
  height?: string;
}

export function ErrorFallback({
  error,
  retry,
  onReset,
  variant = "page",
  label,
  height,
}: ErrorFallbackProps) {
  const appError = error instanceof AppError ? error : null;
  const [showStack, setShowStack] = React.useState(false);

  const handleGoBack = () => {
    onReset?.();
    window.history.back();
  };

  const handleHome = () => {
    onReset?.();
    navTo("/");
  };

  const handleReport = () => {
    const body = [
      `**Error**: ${error.message}`,
      appError ? `**Code**: ${appError.code}` : "",
      `**URL**: ${window.location.href}`,
      `**Stack**:`,
      "```",
      error.stack || "(no stack)",
      "```",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(
      `${repo}/issues/new?title=${encodeURIComponent(`[Error] ${error.message}`)}&body=${encodeURIComponent(body)}`,
      "_blank"
    );
  };

  if (variant === "panel") {
    return (
      <div
        className="proof-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: height || 200,
          gap: 12,
          padding: 24,
          background: "var(--proof-surface-2)",
          textAlign: "center",
          borderStyle: "dashed",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--proof-red-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={24} style={{ color: "var(--proof-red)" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--proof-text)", marginBottom: 4 }}>
            {label || "Component Error"}
          </div>
          <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", maxWidth: 300, lineHeight: 1.5 }}>
            {error.message}
          </div>
        </div>
        {retry && (
          <button
            onClick={retry}
            className="proof-btn proof-btn-ghost"
            style={{ marginTop: 8, border: "1px solid var(--proof-border)" }}
          >
            <RefreshCw size={14} />
            Reload Component
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        animation: "slide-up 0.5s ease-out both",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: 24,
        padding: 40,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--proof-red-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 40px var(--proof-red-glow)",
        }}
      >
        <AlertTriangle size={40} style={{ color: "var(--proof-red)" }} />
      </div>

      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)", margin: "0 0 12px 0" }}>
          {label ?? "Something went wrong"}
        </h2>
        <p style={{ fontSize: 15, color: "var(--proof-text-secondary)", margin: "0 auto", lineHeight: 1.6, wordBreak: "break-word" }}>
          {error.message}
        </p>
        {appError && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              padding: "4px 10px",
              borderRadius: "var(--proof-radius)",
              background: "var(--proof-surface-2)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-secondary)",
            }}
          >
            <Bug size={12} />
            Error code: {appError.code}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        {retry && (
          <button onClick={retry} className="proof-btn proof-btn-primary">
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
        <button onClick={handleGoBack} className="proof-btn proof-btn-ghost" style={{ border: "1px solid var(--proof-border)" }}>
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button onClick={handleHome} className="proof-btn proof-btn-ghost" style={{ border: "1px solid var(--proof-border)" }}>
          <Home size={16} />
          Dashboard
        </button>
        <button onClick={handleReport} className="proof-btn proof-btn-ghost" style={{ border: "1px solid var(--proof-border)" }}>
          <Bug size={16} />
          Report Issue
        </button>
      </div>

      <details
        style={{
          marginTop: 40,
          width: "100%",
          maxWidth: 640,
        }}
        open={showStack}
        onToggle={(e) => setShowStack((e.target as HTMLDetailsElement).open)}
      >
        <summary
          style={{
            fontSize: 13,
            color: "var(--proof-text-secondary)",
            cursor: "pointer",
            textAlign: "center",
            padding: "8px",
          }}
        >
          {import.meta.env.DEV ? "Show technical details" : "More information"}
        </summary>
        <pre
          className="proof-mono"
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--proof-text-secondary)",
            background: "var(--proof-surface-2)",
            padding: 20,
            borderRadius: "var(--proof-radius-lg)",
            border: "1px solid var(--proof-border)",
            overflow: "auto",
            maxHeight: 300,
            lineHeight: 1.6,
          }}
        >
          {import.meta.env.DEV
            ? error.stack
            : "An unexpected error occurred. Please refresh the page."}
        </pre>
      </details>
    </div>
  );
}
