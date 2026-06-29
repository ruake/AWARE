import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { navTo } from "@/lib/nav";

interface Props {
  children: React.ReactNode;
  label?: string;
  variant?: "page" | "panel";
  height?: string;
}

interface State {
  error: Error | null;
  retryKey: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleRetry = () => {
    this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }));
  };

  handleHome = () => {
    this.setState({ error: null });
    navTo("/");
  };

  render() {
    if (!this.state.error) {
      return <div key={this.state.retryKey} style={{ display: "contents" }}>{this.props.children}</div>;
    }

    const isPanel = this.props.variant === "panel";

    if (isPanel) {
      return (
        <div
          className="proof-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: this.props.height || 200,
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
              {this.props.label || "Component Error"}
            </div>
            <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", maxWidth: 300, lineHeight: 1.5 }}>
              {this.state.error.message}
            </div>
          </div>
          <button
            onClick={this.handleRetry}
            className="proof-btn proof-btn-ghost"
            style={{ marginTop: 8, border: "1px solid var(--proof-border)" }}
          >
            <RefreshCw size={14} />
            Reload Component
          </button>
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
        
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)", margin: "0 0 12px 0" }}>
            {this.props.label ?? "Something went wrong"}
          </h2>
          <p style={{ fontSize: 15, color: "var(--proof-text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            {this.state.error.message}
          </p>
        </div>
        
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <button
            onClick={this.handleRetry}
            className="proof-btn proof-btn-primary"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <button
            onClick={this.handleHome}
            className="proof-btn proof-btn-ghost"
            style={{ border: "1px solid var(--proof-border)" }}
          >
            <Home size={16} />
            Dashboard
          </button>
        </div>
        
        <details
          style={{
            marginTop: 40,
            width: "100%",
            maxWidth: 640,
          }}
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
              ? this.state.error.stack 
              : "An unexpected error occurred. Please refresh the page."}
          </pre>
        </details>
      </div>
    );
  }
}
