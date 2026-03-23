"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Tracking-Crash] Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center border border-rose-500/20 shadow-2xl shadow-rose-500/20">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Tracking Engine Halted</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              A temporary glitch occurred while rendering the live map. We&apos;re ready to restart the tracking engine.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Restart Tracker</span>
          </button>
        </div>
      );
    }

    return this.children;
  }
}
