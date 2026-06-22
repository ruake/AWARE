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
            gap: 12,
            padding: 24,
            background: "var(--proof-surface)",
            borderRadius: "var(--proof-radius)",
            border: "1px solid var(--proof-border)",
            boxShadow: "var(--proof-shadow-sm)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={20} style={{ color: "var(--proof-yellow)" }} />
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--proof-text)",
            }}
          >
            {this.props.label || "Panel encounterd an error"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              maxWidth: 320,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {this.state.error.message}
          </div>
          <button
            onClick={this.handleRetry}
            className="proof-button proof-button-primary"
            style={{ marginTop: 8 }}
          >
            <RefreshCw size={14} />
            Retry Component
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
          minHeight: "60vh",
          gap: 20,
          padding: 40,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <AlertTriangle size={40} style={{ color: "var(--proof-red)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--proof-text)",
              margin: "0 0 8px 0",
            }}
          >
            {this.props.label ?? "Application Error"}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--proof-text-secondary)",
              maxWidth: 480,
              textAlign: "center",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {this.state.error.message}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button
            onClick={this.handleRetry}
            className="proof-button proof-button-primary"
            style={{ padding: "10px 24px" }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <button
            onClick={this.handleHome}
            className="proof-button"
            style={{ padding: "10px 24px" }}
          >
            <Home size={16} />
            Back to Dashboard
          </button>
        </div>
        <details
          style={{
            marginTop: 32,
            width: "100%",
            maxWidth: 640,
          }}
        >
          <summary
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              cursor: "pointer",
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            Show technical details
          </summary>
          <pre
            style={{
              marginTop: 12,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-secondary)",
              background: "var(--proof-surface-2)",
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--proof-border)",
              overflow: "auto",
              maxHeight: 240,
            }}
          >
            {this.state.error.stack}
          </pre>
        </details>
      </div>
    );
  }
}
