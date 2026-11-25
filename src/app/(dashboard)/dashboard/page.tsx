"use client";

import React, { useState, useEffect, useCallback } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppointmentChart } from "@/components/dashboard/AppointmentChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentSubmissionsTable } from "@/components/dashboard/RecentSubmissionsTable";
import { MOCK_DASHBOARD_DATA } from "@/data/mock-dashboard";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardOverviewPage() {
  const [data, setData] = useState(MOCK_DASHBOARD_DATA);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData((prev) => ({
            ...prev,
            metrics: json.data.metrics || prev.metrics,
            kpis: json.data.kpis || prev.kpis,
            recentSubmissions:
              json.data.recentSubmissions && json.data.recentSubmissions.length > 0
                ? json.data.recentSubmissions.map((s: any) => ({
                    id: s.id || s.referenceId,
                    type: "appointment",
                    customerName: s.customerName,
                    phoneNumber: s.phone,
                    vehicleReg: s.vehicleReg,
                    postcode: s.postcode,
                    service: s.serviceType,
                    status: s.status,
                    submittedAt: s.submittedAt,
                    urgency: s.status === "pending" ? "high" : "normal",
                  }))
                : prev.recentSubmissions,
          }));
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic dashboard stats, showing initial layout:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { metrics, activityTrends, recentSubmissions } = data;
  const pendingCount = data.kpis?.pendingAppointments || 0;

  return (
    <div className="space-y-8 pb-10 max-w-7xl">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-navy tracking-tight">
            Operations Command Overview
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Live operations dashboard for Mobile Tyre Champions Surrey, Hampshire &amp; Berkshire
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="gap-2 text-xs font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync
        </Button>
      </div>

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
        {metrics.map((metric, i) => (
          <KpiCard key={i} metric={metric} />
        ))}
      </div>

      {/* Main Charts & Quick Actions Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <AppointmentChart data={activityTrends} />
        <QuickActions />
      </div>

      {/* Recent Submissions Live Queue */}
      <div className="grid grid-cols-1 gap-6">
        <RecentSubmissionsTable submissions={recentSubmissions} />
      </div>
    </div>
  );
}
