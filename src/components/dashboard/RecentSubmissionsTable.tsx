"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { RecentSubmissionItem } from "@/types/dashboard";
import { formatUKDateTime } from "@/lib/utils";
import { ArrowUpRight, Phone, Car, MapPin, Search } from "lucide-react";
import Link from "next/link";

interface RecentSubmissionsTableProps {
  submissions: RecentSubmissionItem[];
}

export const RecentSubmissionsTable: React.FC<RecentSubmissionsTableProps> = ({
  submissions,
}) => {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filtered = submissions.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(term) ||
      item.phoneNumber.includes(term) ||
      item.postcode.toLowerCase().includes(term) ||
      (item.vehicleReg && item.vehicleReg.toLowerCase().includes(term))
    );
  });

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Recent Customer Activity</CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Queue ({submissions.length})
            </span>
          </div>
          <CardDescription>
            Real-time feed of booking appointments, roadside emergency calls, and tyre inquiries
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filters */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            {["all", "emergency", "appointment", "contact", "callback"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  filter === tab
                    ? "bg-white text-brand-navy shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab === "all" ? "All Submissions" : tab}
              </button>
            ))}
          </div>

          <Link href="/appointments">
            <Button variant="outline" size="sm" className="gap-1 font-bold text-xs">
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket & Customer</TableHead>
              <TableHead>Phone & Location</TableHead>
              <TableHead>Service Required</TableHead>
              <TableHead>Vehicle Reg</TableHead>
              <TableHead>Preferred Slot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  No submissions match the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80">
                  <TableCell>
                    <div className="font-bold text-slate-900">{item.customerName}</div>
                    <div className="text-xs font-medium text-slate-400 font-mono">
                      {item.id} • {formatUKDateTime(item.submittedAt)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium text-xs text-slate-800">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <a href={`tel:${item.phoneNumber}`} className="hover:text-brand-orange">
                        {item.phoneNumber}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="h-3 w-3 text-brand-orange" />
                      <span className="font-semibold text-slate-700">{item.postcode}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-semibold text-xs text-brand-navy">
                      {item.serviceType}
                    </div>
                  </TableCell>

                  <TableCell>
                    {item.vehicleReg ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 border border-yellow-300 rounded font-mono font-bold text-xs text-slate-900 tracking-wider">
                        {item.vehicleReg}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">N/A</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-slate-600 font-medium">
                      {item.timingSlot || "Flexible"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <StatusBadge
                      status={item.status}
                      isEmergency={item.type === "emergency"}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Link href={`/appointments?id=${item.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 font-bold text-xs hover:text-brand-orange">
                        Triage
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
