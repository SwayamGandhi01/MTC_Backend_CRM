"use client";

import React from "react";
import { UserDropdown } from "./UserDropdown";
import { MobileNav } from "./MobileNav";
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
}

export const Header: React.FC<HeaderProps> = ({
  title = "Dashboard",
  description = "Mobile Tyre Champions Central Operations",
  user,
  userPermissions,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8">
      {/* Mobile Nav Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <MobileNav userPermissions={userPermissions} />
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
