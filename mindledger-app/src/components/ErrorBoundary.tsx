import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MindLedger UI caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div id="mindledger-error-boundary" className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Something unexpected occurred</h2>
              <p className="text-xs text-slate-500 mt-1">
                MindLedger encountered an issue loading this view. You can safely reload the workspace.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="text-[11px] font-mono text-left bg-slate-100 p-3 rounded-xl text-slate-700 overflow-x-auto max-h-32 border border-slate-200">
                {this.state.error.message}
              </div>
            )}
            <button
              id="reload-app-button"
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 bg-[#5749e2] hover:bg-[#4738cf] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload MindLedger</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
