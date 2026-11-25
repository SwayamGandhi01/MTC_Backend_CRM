import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PhoneCall,
  CalendarPlus,
  MapPin,
  RefreshCw,
  Send,
  Wrench,
  Download,
  AlertOctagon,
} from "lucide-react";
import Link from "next/link";

export const QuickActions: React.FC = () => {
  return (
    <Card className="col-span-full xl:col-span-4 flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle>Operations & Dispatch</CardTitle>
        <CardDescription>
          Rapid actions for call handlers and dispatch technicians
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {/* Urgent Emergency Call */}
        <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200/80 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-brand-orange uppercase tracking-wider">
              <AlertOctagon className="h-4 w-4" /> Priority Hotline
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1">0207 101 3856</p>
            <p className="text-xs text-slate-500 font-medium">MTC 24/7 Roadside Line</p>
          </div>
          <a href="tel:02071013856">
            <Button size="sm" className="bg-brand-orange hover:bg-brand-orangeHover font-bold text-xs shadow-none">
              Call Direct
            </Button>
          </a>
        </div>

        {/* Quick action grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Link href="/appointments?action=new" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-11 text-xs font-bold border-slate-200 hover:border-slate-300">
              <CalendarPlus className="h-4 w-4 text-brand-blue" />
              <span>Log Booking</span>
            </Button>
          </Link>

          <Link href="/locations" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-11 text-xs font-bold border-slate-200 hover:border-slate-300">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Check Zone</span>
            </Button>
          </Link>

          <Link href="/emails" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-11 text-xs font-bold border-slate-200 hover:border-slate-300">
              <Send className="h-4 w-4 text-purple-600" />
              <span>Email Test</span>
            </Button>
          </Link>

          <Link href="/reviews" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-11 text-xs font-bold border-slate-200 hover:border-slate-300">
              <RefreshCw className="h-4 w-4 text-brand-orange" />
              <span>Sync Google</span>
            </Button>
          </Link>
        </div>

        {/* System notice */}
        <div className="pt-2">
          <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-xs text-slate-500 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-700 block">Dispatch Mode: Active</span>
              <span className="text-[11px] text-slate-400">Coverage: Surrey, Hampshire & Berkshire</span>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
