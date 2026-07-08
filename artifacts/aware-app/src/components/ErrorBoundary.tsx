import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="flex min-h-64 items-start justify-center px-6 pt-16">
          <motion.div 
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-lg space-y-4 rounded-xl border border-gcp-red/25 bg-gcp-surface/60 p-6 shadow-xl shadow-black/30 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gcp-red/25 bg-gcp-red/15"
                animate={{ boxShadow: ['0 0 0px rgba(234,67,53,0)', '0 0 16px rgba(234,67,53,0.3)', '0 0 0px rgba(234,67,53,0)'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                <AlertTriangle size={18} className="text-gcp-red" />
              </motion.div>
              <div>
                <div className="text-sm font-semibold text-gcp-red">Something went wrong</div>
                <div className="mt-0.5 text-xs text-gcp-text-muted">
                  An unexpected error occurred in this section.
                </div>
              </div>
            </div>

            {error?.message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden rounded-lg border border-gcp-border/50 bg-gcp-bg/60 px-4 py-3"
              >
                <p className="break-all font-mono text-xs text-gcp-text-secondary">{error.message}</p>
              </motion.div>
            )}

            {error?.stack && (
              <div>
                <motion.button
                  onClick={this.toggleStack}
                  className="flex cursor-pointer items-center gap-1.5 text-xs text-gcp-text-muted transition-colors hover:text-gcp-text"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {showStack
                    ? <ChevronDown size={12} />
                    : <ChevronRight size={12} />}
                  {showStack ? 'Hide' : 'Show'} stack trace
                </motion.button>
                <AnimatePresence initial={false}>
                  {showStack && (
                    <motion.pre
                      key="stack"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="mt-2 max-h-48 overflow-auto overflow-x-hidden rounded-lg border border-gcp-border/50 bg-gcp-bg p-3 font-mono text-[10px] text-gcp-text-muted"
                    >
                      {error.stack}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>
            )}

            <motion.button
              onClick={this.reload}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gcp-blue px-4 py-2 text-xs font-semibold text-white transition-all duration-200"
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(66,133,244,0.4)' }}
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw size={12} />
              Reload page
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
