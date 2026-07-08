import React from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="text-gcp-red text-lg font-semibold">Something went wrong</div>
            <div className="text-gcp-text-muted text-sm">{this.state.error?.message}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
