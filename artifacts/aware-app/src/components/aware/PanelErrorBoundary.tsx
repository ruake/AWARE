import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  label?: string;
  height?: string;
}

interface State {
  error: Error | null;
}

export class PanelErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: this.props.height || 200, gap: 8, padding: 16,
          background: "var(--proof-surface)", borderRadius: 6,
          border: "1px solid var(--proof-grey)",
        }}>
          <AlertTriangle size={20} style={{ color: "var(--proof-yellow)" }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text-secondary)" }}>
            {this.props.label || "Panel error"}
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", maxWidth: 300, textAlign: "center" }}>
            {this.state.error.message}
          </div>
          <button onClick={this.handleRetry} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", fontSize: 12, fontWeight: 500,
            background: "var(--proof-blue)", color: "white",
            border: "none", borderRadius: 4, cursor: "pointer", marginTop: 4,
          }}>
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
