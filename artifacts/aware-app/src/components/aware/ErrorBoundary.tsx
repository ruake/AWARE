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

  handleRetry = () => {
    this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }));
  };

  handleHome = () => {
    this.setState({ error: null });
    navTo("/");
  };

  render() {
    if (!this.state.error) {
      return <div key={this.state.retryKey}>{this.props.children}</div>;
    }

    const isPanel = this.props.variant === "panel";

    if (isPanel) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: this.props.height || 200,
            gap: 8,
            padding: 16,
            background: "var(--proof-surface)",
            borderRadius: 6,
            border: "1px solid var(--proof-grey)",
          }}
        >
          <AlertTriangle size={20} style={{ color: "var(--proof-yellow)" }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text-secondary)" }}>
            {this.props.label || "Panel error"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              maxWidth: 300,
              textAlign: "center",
            }}
          >
            {this.state.error.message}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              background: "var(--proof-blue)",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 16,
          padding: 32,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--proof-red-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={28} style={{ color: "var(--proof-red)" }} />
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--proof-text)",
            margin: 0,
          }}
        >
          {this.props.label ?? "Something went wrong"}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--proof-text-secondary)",
            maxWidth: 400,
            textAlign: "center",
            margin: 0,
          }}
        >
          {this.state.error.message}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={this.handleRetry}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 500,
              background: "var(--proof-blue)",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
          <button
            onClick={this.handleHome}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 500,
              background: "transparent",
              color: "var(--proof-text-secondary)",
              border: "1px solid var(--proof-border)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <Home size={14} />
            Dashboard
          </button>
        </div>
        <details style={{ marginTop: 16, width: "100%", maxWidth: 512 }}>
          <summary
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              cursor: "pointer",
            }}
          >
            Stack trace
          </summary>
          <pre
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              background: "var(--proof-surface)",
              padding: 12,
              borderRadius: 6,
              overflow: "auto",
              maxHeight: 192,
            }}
          >
            {this.state.error.stack}
          </pre>
        </details>
      </div>
    );
  }
}
