import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { navTo } from "./nav";

interface Props {
  children: React.ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
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

  handleHome = () => {
    this.setState({ error: null });
    navTo("/Dashboard");
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
          <div className="size-14 rounded-full bg-[var(--gcp-red)]/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-[var(--gcp-red)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--gcp-text-primary)]">
            {this.props.label ?? "Something went wrong"}
          </h2>
          <p className="text-sm text-[var(--gcp-text-secondary)] max-w-md text-center">
            {this.state.error.message}
          </p>
          <div className="flex gap-3 mt-2">
            <button onClick={this.handleRetry} className="gcp-button-primary flex items-center gap-2">
              <RefreshCw size={14} />
              Retry
            </button>
            <button onClick={this.handleHome} className="gcp-button flex items-center gap-2">
              <Home size={14} />
              Dashboard
            </button>
          </div>
          <details className="mt-4 w-full max-w-lg">
            <summary className="text-xs text-[var(--gcp-text-secondary)] cursor-pointer hover:text-[var(--gcp-text-primary)]">
              Stack trace
            </summary>
            <pre className="mt-2 text-xs text-[var(--gcp-text-secondary)] bg-[var(--gcp-surface)] p-3 rounded overflow-auto max-h-48">
              {this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
