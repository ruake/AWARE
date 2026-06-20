import React from "react";
import {
  AlertTriangle,
  X,
  RefreshCw,
  Settings,
  Wifi,
  Key,
  ChevronDown,
  ChevronRight,
  Bug,
} from "lucide-react";
import type { Message } from "@/lib/copilot/types";

interface ErrorRecoveryProps {
  message: Message;
  onRetry: (messageId: string) => void;
  onRetryWithFix?: (messageId: string, fix: string) => void;
  onDismiss: (messageId: string) => void;
}

interface ErrorClassification {
  label: string;
  description: string;
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    action: "retry" | "settings" | "simplify" | "fix";
    fix?: string;
  }>;
}

function classifyError(error: string): ErrorClassification {
  const lower = error.toLowerCase();

  if (lower.includes("api key") || lower.includes("api_key") || lower.includes("api-key")) {
    return {
      label: "API Key Issue",
      description: "Check your API key in Settings",
      actions: [
        { label: "Open Settings", icon: <Key size={12} />, action: "settings" },
        { label: "Retry", icon: <RefreshCw size={12} />, action: "retry" },
      ],
    };
  }

  if (lower.includes("network error") || lower.includes("fetch") || lower.includes("network") || lower.includes("econnrefused") || lower.includes("enotfound")) {
    return {
      label: "Network Connection Issue",
      description: "Network connection issue. Check your API URL.",
      actions: [
        { label: "Retry", icon: <RefreshCw size={12} />, action: "retry" },
        { label: "Open Settings", icon: <Wifi size={12} />, action: "settings" },
      ],
    };
  }

  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("time_out")) {
    return {
      label: "Request Timeout",
      description: "Request timed out. Try a shorter query or reduce context.",
      actions: [
        { label: "Retry", icon: <RefreshCw size={12} />, action: "retry" },
        { label: "Simplify Query", icon: <AlertTriangle size={12} />, action: "simplify" },
      ],
    };
  }

  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("rate_limit") || lower.includes("too many requests")) {
    return {
      label: "Rate Limited",
      description: "Rate limited. Waiting before retry…",
      actions: [
        { label: "Retry", icon: <RefreshCw size={12} />, action: "retry" },
      ],
    };
  }

  if (lower.includes("authentication") || lower.includes("auth") || lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return {
      label: "Authentication Failed",
      description: "Authentication failed. Verify your API key.",
      actions: [
        { label: "Open Settings", icon: <Key size={12} />, action: "settings" },
        { label: "Retry", icon: <RefreshCw size={12} />, action: "retry" },
      ],
    };
  }

  if (lower.includes("model") || lower.includes("404") || lower.includes("not found") || lower.includes("model_not_found") || lower.includes("deployment")) {
    return {
      label: "Model Not Found",
      description: "Model not found. Check model name in Settings.",
      actions: [
        { label: "Open Settings", icon: <Settings size={12} />, action: "settings" },
        { label: "Retry", icon: <RefreshCw size={12} />, action: "retry" },
      ],
    };
  }

  if (lower.includes("context length") || lower.includes("max tokens") || lower.includes("token limit") || lower.includes("too long") || lower.includes("context_length")) {
    return {
      label: "Context Length Exceeded",
      description: "The query was too long. Try a shorter query or reduce context.",
      actions: [
        { label: "Simplify Query", icon: <AlertTriangle size={12} />, action: "simplify" },
      ],
    };
  }

  return {
    label: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again or rephrase your query.",
    actions: [
      { label: "Retry", icon: <RefreshCw size={12} />, action: "retry" },
    ],
  };
}

export default function ErrorRecovery({ message, onRetry, onRetryWithFix, onDismiss }: ErrorRecoveryProps) {
  const [stackVisible, setStackVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || !message.error) return null;

  const classification = classifyError(message.error);

  const handleAction = (act: ErrorClassification["actions"][number]) => {
    switch (act.action) {
      case "retry":
        onRetry(message.id);
        break;
      case "settings":
        window.dispatchEvent(new CustomEvent("open-settings"));
        onDismiss(message.id);
        break;
      case "simplify":
        onRetry(message.id);
        break;
      case "fix":
        if (onRetryWithFix && act.fix) {
          onRetryWithFix(message.id, act.fix);
        } else {
          onRetry(message.id);
        }
        break;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss(message.id);
  };

  return (
    <div
      role="alert"
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(248,113,113,0.25)",
        borderRadius: "var(--proof-radius-lg)",
        padding: "12px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        color: "var(--proof-text)",
        animation: "copilotSlideUp 0.25s ease-out",
        marginTop: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 1,
            animation: "glow-pulse 2s ease-in-out infinite",
            color: "var(--proof-red)",
          }}
        >
          <AlertTriangle size={14} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 12.5, color: "var(--proof-red-bright)" }}>
              {classification.label}
            </span>
            <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: "var(--proof-text-secondary)",
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            {classification.description}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {classification.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => handleAction(act)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: "var(--proof-radius-full)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid rgba(248,113,113,0.2)",
                  background: "rgba(239,68,68,0.08)",
                  color: "var(--proof-red-bright)",
                  transition: "all 0.15s",
                  lineHeight: 1.3,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.16)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.2)";
                }}
              >
                {act.icon}
                {act.label}
              </button>
            ))}
          </div>

          {message.error && (
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setStackVisible((p) => !p)}
                aria-expanded={stackVisible}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 0",
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  color: "var(--proof-text-muted)",
                  transition: "color 0.15s",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
                }}
              >
                <Bug size={10} />
                {stackVisible ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                Error Details
              </button>
              {stackVisible && (
                <pre
                  style={{
                    marginTop: 6,
                    padding: "8px 10px",
                    fontSize: 10.5,
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-text-muted)",
                    background: "rgba(0,0,0,0.25)",
                    borderRadius: "var(--proof-radius-sm)",
                    border: "1px solid var(--proof-border)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    lineHeight: 1.5,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {message.error}
                </pre>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss error"
          title="Dismiss"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
