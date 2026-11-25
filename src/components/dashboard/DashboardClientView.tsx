"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppointmentChart } from "@/components/dashboard/AppointmentChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentSubmissionsTable } from "@/components/dashboard/RecentSubmissionsTable";
import { DashboardOverviewData } from "@/types/dashboard";
import { AlertCircle, RefreshCw, Database, AlertTriangle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardClientViewProps {
  initialData: DashboardOverviewData | null;
  initialError: string | null;
}

export const DashboardClientView: React.FC<DashboardClientViewProps> = ({
  initialData,
  initialError,
}) => {
  const [data, setData] = useState<DashboardOverviewData | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);
  const [isConnectedRealtime, setIsConnectedRealtime] = useState(false);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshStats = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard/stats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error?.message || "Invalid response structure from stats API");
      }
    } catch (err: any) {
      console.error("[Dashboard Client Sync Error]", err);
      if (!data) {
        setError("Unable to load live dashboard data. Please check database connectivity.");
      } else {
        setError("Unable to refresh latest metrics from database.");
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [data]);

  // Real-Time Event Subscription (Ably / SSE with Auto-Reconnection & Reconciliation)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    function connectRealtime() {
      try {
        eventSource = new EventSource("/api/realtime/sse");

        eventSource.onopen = () => {
          if (!isMounted) return;
          setIsConnectedRealtime(true);
          // Reconcile stats upon connection or re-connection
          refreshStats(true);
        };

        const handleRealtimeEvent = (evt: MessageEvent) => {
          if (!isMounted) return;
          try {
            const parsed = JSON.parse(evt.data);
            const eventName = evt.type || parsed.eventType;
            const ref = parsed.metadata?.referenceId || parsed.entityId;

            let label = "New business event received";
            if (eventName.includes("appointment")) {
              label = `New appointment received (${ref || "APT"})`;
            } else if (eventName.includes("emergency")) {
              label = `🚨 Roadside emergency request received (${ref || "EMERGENCY"})`;
            } else if (eventName.includes("enquiry")) {
              label = `New quote enquiry received (${ref || "ENQ"})`;
            } else if (eventName.includes("callback")) {
              label = `New callback request added to queue (${ref || "CB"})`;
            }

            setRealtimeNotice(label);
            if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
            noticeTimerRef.current = setTimeout(() => {
              if (isMounted) setRealtimeNotice(null);
            }, 6000);

            // Re-fetch affected metrics immediately
            refreshStats(true);
          } catch {
            refreshStats(true);
          }
        };

        eventSource.addEventListener("appointment.created", handleRealtimeEvent);
        eventSource.addEventListener("emergency_request.created", handleRealtimeEvent);
        eventSource.addEventListener("enquiry.created", handleRealtimeEvent);
        eventSource.addEventListener("callback.created", handleRealtimeEvent);
        eventSource.addEventListener("appointment.updated", handleRealtimeEvent);
        eventSource.addEventListener("appointment.status_changed", handleRealtimeEvent);

        eventSource.onerror = () => {
          if (!isMounted) return;
          setIsConnectedRealtime(false);
        };
      } catch (err) {
        console.warn("[Realtime Client Connection Error]", err);
      }
    }

    connectRealtime();

    return () => {
      isMounted = false;
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [refreshStats]);

  // Full-page error state when initial data failed and no cached data is available
  if (error && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
          <Database className="h-8 w-8 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Unable to Load Dashboard Data
          </h2>
          <p className="text-xs text-slate-500 max-w-md">
            The CRM could not retrieve live metrics from MongoDB Atlas. This may be due to network latency, IP access list restrictions, or database unavailability.
          </p>
        </div>
        <Button
          onClick={() => refreshStats(false)}
          disabled={isRefreshing}
          className="gap-2 bg-brand-navy hover:bg-brand-navyLight text-white font-bold text-xs px-6 py-2 rounded-xl shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Retry Connection
        </Button>
      </div>
    );
  }

  const metrics = data?.metrics || [];
  const activityTrends = data?.activityTrends || [];
  const recentSubmissions = data?.recentSubmissions || [];
  const pendingCount = data?.kpis?.pendingAppointments || 0;

  return (
    <div className="space-y-8 pb-10 max-w-7xl">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-brand-navy tracking-tight">
              Operations Command Overview
            </h1>
            {isConnectedRealtime && (
              <span
                title="Connected to live real-time event pipeline"
                className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
              >
                <Radio className="h-3 w-3 animate-pulse text-emerald-600" />
                Live Feed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Live operations dashboard for Mobile Tyre Champions Surrey, Hampshire &amp; Berkshire
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshStats(false)}
          disabled={isRefreshing}
          className="gap-2 text-xs font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Syncing..." : "Sync"}
        </Button>
      </div>

      {/* Real-time Event Toast Banner */}
      {realtimeNotice && (
        <div className="rounded-xl bg-blue-50 border border-blue-200/90 p-3.5 text-blue-900 text-xs flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="h-4 w-4 text-brand-blue animate-pulse shrink-0" />
            <span>{realtimeNotice}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            Updated Just Now
          </span>
        </div>
      )}

      {/* Sync Warning Banner if a refresh failed while retaining existing data */}
      {error && data && (
        <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{error} Displaying last synchronized database snapshot.</span>
          </div>
          <button
            onClick={() => refreshStats(false)}
            className="font-bold underline text-amber-900 hover:text-amber-700 ml-4 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Emergency Alert Banner if any pending roadside bookings */}
      {pendingCount > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white shadow-lg shadow-orange-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-wide uppercase">
                {pendingCount} Roadside Booking{pendingCount > 1 ? "s" : ""} Currently In Triage Queue
              </h2>
              <p className="text-xs text-white/90 font-medium">
                Customer requests submitted via website awaiting dispatch assignment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/appointments?status=pending"
              className="text-xs font-black uppercase tracking-wider bg-brand-navy hover:bg-brand-navyLight px-4 py-2 rounded-xl text-white transition-all shadow-sm"
            >
              Triage Appointments
            </a>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {!data && isRefreshing
          ? Array.from({ length: 4 }).map((_, i) => <KpiCard key={i} loading={true} />)
          : metrics.map((metric, i) => (
              <KpiCard key={i} metric={metric} loading={false} />
            ))}
      </div>

      {/* Main Charts & Quick Actions Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <AppointmentChart data={activityTrends} loading={!data && isRefreshing} />
        <QuickActions />
      </div>

      {/* Recent Submissions Live Queue */}
      <div className="grid grid-cols-1 gap-6">
        <RecentSubmissionsTable
          submissions={recentSubmissions}
          loading={!data && isRefreshing}
        />
      </div>
    </div>
  );
};
