"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Runtime Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Dashboard Encountered an Issue
        </h2>
        <p className="text-xs text-slate-500 max-w-md">
          {error.message || "A rendering error occurred while loading dashboard components."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="gap-2 bg-brand-navy hover:bg-brand-navyLight text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="text-xs font-bold px-5 py-2 rounded-xl"
        >
          Reload Page
        </Button>
      </div>
    </div>
  );
}
