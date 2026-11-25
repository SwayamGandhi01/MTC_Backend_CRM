"use client";

import React, { useEffect, useState } from "react";
import { UserDropdown } from "./UserDropdown";
import { MobileNav } from "./MobileNav";
import { SidebarBadgeCounts } from "./Sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface HeaderProps {
  title?: string;
  description?: string;
  user?: {
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
  };
  userPermissions?: string[];
  badgeCounts?: SidebarBadgeCounts;
}

interface DbHealthState {
  status: "connected" | "disconnected" | "checking";
  database?: string;
  latencyMs?: number;
  message?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Dashboard",
  description = "Mobile Tyre Champions Central Operations",
  user,
  userPermissions,
  badgeCounts,
}) => {
  const [dbHealth, setDbHealth] = useState<DbHealthState>({
    status: "checking",
  });

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const res = await fetch("/api/health/database");
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.status === "connected") {
          setDbHealth({
            status: "connected",
            database: data.database,
            latencyMs: data.latencyMs,
          });
        } else {
          setDbHealth({
            status: "disconnected",
            database: data.database,
            message: data.error?.message || "Connection failed",
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        setDbHealth({
          status: "disconnected",
          message: err?.message || "Health check failed",
        });
      }
    }

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8">
      {/* Mobile Nav Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <MobileNav userPermissions={userPermissions} badgeCounts={badgeCounts} />
        <div>
          <h1 className="text-base sm:text-lg font-black text-brand-navy leading-none">
            {title}
          </h1>
          <p className="hidden sm:block text-xs font-medium text-slate-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <Input
          type="text"
          placeholder="Search bookings, reg, phone, postcode..."
          icon={<Search className="h-4 w-4" />}
          className="h-9 bg-slate-50 border-slate-200 focus-visible:bg-white text-xs"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Subtle Database Connection Status Indicator */}
        {dbHealth.status === "connected" && (
          <div
            title={`MongoDB Atlas (${dbHealth.database || "mtc_crm"}) - Latency: ${dbHealth.latencyMs ?? 0}ms`}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs cursor-default select-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Atlas Live</span>
          </div>
        )}

        {dbHealth.status === "disconnected" && (
          <div
            title={`MongoDB Atlas Disconnected: ${dbHealth.message || "Offline"}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 shadow-xs cursor-default select-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Atlas Offline</span>
          </div>
        )}

        {dbHealth.status === "checking" && (
          <div
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200/60 cursor-default select-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-pulse" />
            <span>Checking DB...</span>
          </div>
        )}

        {/* Urgent Notification Bell */}
        <button
          aria-label="Notifications"
          className="relative h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
        </button>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* User Dropdown */}
        <UserDropdown user={user} />
      </div>
    </header>
  );
};
