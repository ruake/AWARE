import React from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; showStack: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, showStack: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reload = () => window.location.reload();
  private toggleStack = () => this.setState(s => ({ showStack: !s.showStack }));

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, showStack } = this.state;

      return (
        <div className="flex items-start justify-center min-h-64 pt-16 px-6">
          <div className="w-full max-w-lg rounded-xl border border-gcp-red/30 bg-gcp-red/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gcp-red/15 border border-gcp-red/25 flex-shrink-0">
                <AlertTriangle size={16} className="text-gcp-red" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gcp-red">Something went wrong</div>
                <div className="text-xs text-gcp-text-muted mt-0.5">
                  An unexpected error occurred in this section.
                </div>
              </div>
            </div>

            {error?.message && (
              <div className="rounded-lg bg-gcp-bg/60 border border-gcp-border px-4 py-3">
                <p className="text-xs font-mono text-gcp-text-secondary break-all">{error.message}</p>
              </div>
            )}

            {error?.stack && (
              <div>
                <button
                  onClick={this.toggleStack}
                  className="flex items-center gap-1.5 text-xs text-gcp-text-muted hover:text-gcp-text transition-colors"
                >
                  {showStack
                    ? <ChevronDown size={12} />
                    : <ChevronRight size={12} />}
                  {showStack ? 'Hide' : 'Show'} stack trace
                </button>
                {showStack && (
                  <pre className="mt-2 rounded-lg bg-gcp-bg border border-gcp-border p-3 text-[10px] font-mono text-gcp-text-muted overflow-x-auto max-h-48 overflow-y-auto">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            <button
              onClick={this.reload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gcp-blue text-white text-xs font-semibold hover:bg-gcp-blue-hover transition-colors"
            >
              <RefreshCw size={12} />
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
