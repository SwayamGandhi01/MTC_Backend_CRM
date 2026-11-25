"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  MessageSquare,
  BookmarkCheck,
  Truck,
  Mail,
  FileText,
  Wrench,
  MapPin,
  Disc,
  Image as ImageIcon,
  Star,
  ShieldAlert,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: "orange" | "blue" | "gray";
  group?: string;
  permission?: string;
}

export const NAV_ITEMS: NavItem[] = [
  // 1. Core Operations
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "Core Operations",
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: CalendarCheck,
    badge: "7",
    badgeColor: "orange",
    group: "Core Operations",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    badge: "148",
    badgeColor: "blue",
    group: "Core Operations",
  },
  {
    title: "Enquiries",
    href: "/enquiries",
    icon: MessageSquare,
    badge: "12",
    badgeColor: "blue",
    group: "Core Operations",
  },
  {
    title: "Bookings Archive",
    href: "/bookings",
    icon: BookmarkCheck,
    group: "Core Operations",
  },
  {
    title: "Technicians & Vans",
    href: "/technicians",
    icon: Truck,
    badge: "4 Active",
    badgeColor: "blue",
    group: "Core Operations",
  },

  // 2. Communications
  {
    title: "Email Centre",
    href: "/emails",
    icon: Mail,
    group: "Communications",
  },
  {
    title: "Google Reviews",
    href: "/reviews",
    icon: Star,
    badge: "4.9 ★",
    badgeColor: "gray",
    group: "Communications",
  },

  // 3. Catalog & Content
  {
    title: "Website Content",
    href: "/content",
    icon: FileText,
    group: "Content & Catalog",
  },
  {
    title: "Services & Pricing",
    href: "/services",
    icon: Wrench,
    group: "Content & Catalog",
  },
  {
    title: "Locations & Zones",
    href: "/locations",
    icon: MapPin,
    badge: "62",
    badgeColor: "gray",
    group: "Content & Catalog",
  },
  {
    title: "Tyre Management",
    href: "/tyres",
    icon: Disc,
    group: "Content & Catalog",
  },
  {
    title: "Fittings Gallery",
    href: "/gallery",
    icon: ImageIcon,
    group: "Content & Catalog",
  },

  // 4. Administration & Security
  {
    title: "Admin Users",
    href: "/users",
    icon: ShieldAlert,
    group: "Administration",
  },
  {
    title: "CRM Settings",
    href: "/settings",
    icon: Settings,
    group: "Administration",
  },
];

interface SidebarProps {
  className?: string;
  userPermissions?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ className, userPermissions }) => {
  const pathname = usePathname();

  const visibleItems =
    userPermissions && userPermissions.length > 0 && userPermissions.length < 30
      ? NAV_ITEMS.filter((item) => !item.permission || userPermissions.includes(item.permission))
      : NAV_ITEMS;

  // Group nav items by section
  const groups = Array.from(new Set(visibleItems.map((item) => item.group || "General")));

  return (
    <aside
      className={cn(
        "flex flex-col h-screen w-64 bg-brand-navy border-r border-slate-800 text-slate-300 shrink-0",
        className
      )}
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-brand-navyDark">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 p-1 border border-white/10 group-hover:border-brand-orange/40 transition-all overflow-hidden shrink-0">
            <Image
              src="/images/mtc-logo.webp"
              alt="Mobile Tyre Champions Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          <div>
            <span className="font-black text-sm text-white tracking-tight block leading-none">
              MOBILE TYRE
            </span>
            <span className="text-[10px] font-bold text-brand-orange tracking-widest block leading-tight mt-0.5">
              CHAMPIONS
            </span>
          </div>
        </Link>
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          CRM
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => {
          const items = visibleItems.filter((i) => (i.group || "General") === group);
          return (
            <div key={group} className="space-y-1">
              <div className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {group}
              </div>
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-brand-blue text-white shadow-sm shadow-blue-900/30 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive
                            ? "text-brand-orange"
                            : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          item.badgeColor === "orange" && "bg-brand-orange text-white",
                          item.badgeColor === "blue" && "bg-blue-500/20 text-blue-300",
                          item.badgeColor === "gray" && "bg-slate-800 text-slate-400"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-brand-navyDark">
        <a
          href="https://mobiletyrechampions.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors py-1"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <ExternalLink className="h-3.5 w-3.5 text-brand-orange" />
            Live Website
          </span>
          <span className="text-[10px] text-slate-400">Independent CRM</span>
        </a>
      </div>
    </aside>
  );
};
