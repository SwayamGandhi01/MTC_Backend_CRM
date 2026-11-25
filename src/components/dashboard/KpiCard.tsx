import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { KpiMetric } from "@/types/dashboard";
import {
  Activity,
  CalendarClock,
  AlertTriangle,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Activity,
  CalendarClock,
  AlertTriangle,
  Star,
};

const COLOR_VARIANTS = {
  blue: {
    bg: "bg-blue-50",
    text: "text-brand-blue",
    border: "border-blue-100",
    iconBg: "bg-blue-600",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-brand-orange",
    border: "border-orange-100",
    iconBg: "bg-brand-orange",
  },
  navy: {
    bg: "bg-slate-100",
    text: "text-brand-navy",
    border: "border-slate-200",
    iconBg: "bg-brand-navy",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    iconBg: "bg-emerald-600",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-100",
    iconBg: "bg-purple-600",
  },
};

export const KpiCard: React.FC<{ metric: KpiMetric }> = ({ metric }) => {
  const IconComponent = ICON_MAP[metric.iconName] || Activity;
  const colors = COLOR_VARIANTS[metric.colorScheme] || COLOR_VARIANTS.navy;

  return (
    <Card className="relative overflow-hidden hover:border-slate-300 transition-all group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {metric.title}
          </span>
          <div
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105",
              colors.iconBg
            )}
          >
            <IconComponent className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-slate-900">
            {metric.value}
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5",
              metric.trend === "up" && "bg-emerald-50 text-emerald-700",
              metric.trend === "down" && "bg-rose-50 text-rose-700",
              metric.trend === "neutral" && "bg-slate-100 text-slate-600"
            )}
          >
            {metric.trend === "up" && <TrendingUp className="h-3 w-3" />}
            {metric.trend === "down" && <TrendingDown className="h-3 w-3" />}
            {metric.change}
          </span>
        </div>

        <p className="mt-2 text-xs text-slate-400 font-medium">
          {metric.description}
        </p>
      </CardContent>
    </Card>
  );
};
