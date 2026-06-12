import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { navTo } from "@/lib/nav";

interface Props {
  children: React.ReactNode;
  label?: string;
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

  static getDerivedStateFromError(error: Error): State {
    return { error, retryKey: 0 };
  }

  handleRetry = () => {
    this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }));
  };

  handleHome = () => {
    this.setState({ error: null });
    navTo("/");
  };

  render() {
    if (this.state.error) {
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
              background: "var(--proof-red-bg, rgba(217,48,37,0.1))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={28} style={{ color: "var(--proof-red, #ef4444)" }} />
          </div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--proof-text, #e8eaed)",
              margin: 0,
            }}
          >
            {this.props.label ?? "Something went wrong"}
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--proof-text-secondary, #9aa0a6)",
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
                background: "var(--proof-blue, #5b8af5)",
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
                color: "var(--proof-text-secondary, #9aa0a6)",
                border: "1px solid var(--proof-grey, #2a2d35)",
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
                color: "var(--proof-text-secondary, #9aa0a6)",
                cursor: "pointer",
              }}
            >
              Stack trace
            </summary>
            <pre
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--proof-text-secondary, #9aa0a6)",
                background: "var(--proof-surface, #141720)",
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
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}
