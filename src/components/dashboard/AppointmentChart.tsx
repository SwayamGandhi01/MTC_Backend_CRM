"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ActivityDataPoint } from "@/types/dashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AppointmentChartProps {
  data: ActivityDataPoint[];
}

export const AppointmentChart: React.FC<AppointmentChartProps> = ({ data }) => {
  return (
    <Card className="col-span-full xl:col-span-8">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Dispatch & Booking Velocity</CardTitle>
          <CardDescription>
            Weekly volume of appointments, emergency callouts, and customer inquiries
          </CardDescription>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-navy" />
            <span className="text-slate-600">Appointments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
            <span className="text-slate-600">Emergency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600">Enquiries</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0C162D" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0C162D" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E67E22" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#E67E22" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs">
                        <p className="font-bold text-slate-900 mb-2">
                          {label} ({payload[0]?.payload?.date})
                        </p>
                        <div className="space-y-1">
                          <p className="flex items-center justify-between gap-4 text-brand-navy font-semibold">
                            <span>Appointments:</span>
                            <span>{payload[0]?.value}</span>
                          </p>
                          <p className="flex items-center justify-between gap-4 text-brand-orange font-semibold">
                            <span>Emergency 24/7:</span>
                            <span>{payload[1]?.value}</span>
                          </p>
                          <p className="flex items-center justify-between gap-4 text-blue-600 font-semibold">
                            <span>Enquiries:</span>
                            <span>{payload[2]?.value}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="#0C162D"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAppointments)"
              />
              <Area
                type="monotone"
                dataKey="emergency"
                stroke="#E67E22"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorEmergency)"
              />
              <Area
                type="monotone"
                dataKey="enquiries"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEnquiries)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
