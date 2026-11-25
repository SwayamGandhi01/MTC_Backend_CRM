"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Shield, ChevronDown, KeyRound, ShieldAlert } from "lucide-react";

export interface UserDropdownProps {
  user?: {
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
  };
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to redirect
    }
    window.location.href = "/login";
  };

  const displayName = user?.name || "Operations Lead";
  const displayEmail = user?.email || "admin@mobiletyrechampions.com";
  const displayRole = user?.role ? user.role.toUpperCase() : "SUPERADMIN";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
      >
        <div className="h-8 w-8 rounded-lg bg-brand-navy flex items-center justify-center text-white font-bold text-xs shadow-sm">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-slate-900 leading-tight">
            {displayName}
          </div>
          <div className="text-[10px] font-semibold text-brand-orange uppercase tracking-wider">
            {displayRole}
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200/80 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
          </div>

          <div className="space-y-0.5">
            <div className="px-3 py-1.5 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-medium">Assigned Role</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-brand-orange">
                {displayRole}
              </span>
            </div>

            <Link
              href="/users"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ShieldAlert className="h-4 w-4 text-slate-400" />
              <span>Admin & Access Control</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
