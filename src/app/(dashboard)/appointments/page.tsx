"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  MapPin,
  Clock,
  Car,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StatusHistoryItem {
  status: string;
  changedBy: string;
  timestamp: string;
  notes?: string;
}

interface AppointmentItem {
  _id: string;
  referenceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleReg: string;
  postcode: string;
  address?: string;
  town?: string;
  locationNotes?: string;
  serviceType: string;
  tyreSize?: string;
  timingSlot: string;
  status: "pending" | "confirmed" | "assigned" | "in_progress" | "completed" | "cancelled";
  paymentStatus: string;
  technicianName?: string;
  priceQuote?: number;
  notes?: string;
  sourcePage?: string;
  statusHistory?: StatusHistoryItem[];
  createdAt: string;
}

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  confirmed: { label: "Confirmed", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  assigned: { label: "Assigned", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  in_progress: { label: "In Progress", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  cancelled: { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail drawer state
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/appointments?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load appointments (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalCount(data.meta?.total || 0);
      } else {
        throw new Error(data.error?.message || "Failed to load data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusUpdate = async (appointmentId: string, targetStatus: string) => {
    if (!targetStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          notes: statusNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Status update failed");
      }
      const updated = await res.json();
      if (updated.success) {
        // Update local state
        setAppointments((prev) =>
          prev.map((item) => (item._id === appointmentId ? updated.data : item))
        );
        if (selectedAppointment?._id === appointmentId) {
          setSelectedAppointment(updated.data);
        }
        setStatusNote("");
        setNewStatus("");
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-navy tracking-tight">
            Appointments Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Triage, dispatch, and manage live mobile tyre fitting appointments ({totalCount} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
            className="gap-2 text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, phone, reg plate, postcode, or reference ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange focus:bg-white transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-orange"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ref ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vehicle &amp; Reg</th>
                <th className="py-3.5 px-4">Service &amp; Tyre</th>
                <th className="py-3.5 px-4">Postcode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timing</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
              {loading && appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-orange" />
                    Loading live appointment bookings from MongoDB Atlas...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-red-600 bg-red-50/50">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    {error}
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={fetchAppointments}>
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    No appointments match your search criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => {
                  const badge = STATUS_BADGES[appt.status] || STATUS_BADGES.pending;
                  return (
                    <tr
                      key={appt._id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedAppointment(appt)}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-100">
                          {appt.referenceId || "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{appt.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {appt.customerPhone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-yellow-400 text-slate-900 font-black px-2 py-0.5 rounded text-[11px] tracking-wider border border-yellow-500 shadow-2xs">
                          {appt.vehicleReg}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{appt.serviceType}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {appt.tyreSize || "Standard"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 uppercase flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-brand-orange" />
                          {appt.postcode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {appt.timingSlot}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAppointment(appt)}
                          className="h-7 text-xs font-bold gap-1 text-brand-navy hover:text-brand-orange"
                        >
                          Details <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} ({totalCount} total bookings)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs font-bold"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Detail Slide-Over Drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black bg-brand-orange text-white px-2.5 py-0.5 rounded">
                    {selectedAppointment.referenceId}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {new Date(selectedAppointment.createdAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-2">
                  {selectedAppointment.customerName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Status Update Quick Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Update Appointment Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {["pending", "confirmed", "assigned", "in_progress", "completed", "cancelled"].map(
                    (st) => {
                      const isCurrent = selectedAppointment.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusUpdate(selectedAppointment._id, st)}
                          disabled={updatingStatus || isCurrent}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            isCurrent
                              ? "bg-brand-navy text-white border-brand-navy shadow-xs cursor-default"
                              : "bg-white text-slate-700 border-slate-200 hover:border-brand-orange hover:text-brand-orange"
                          }`}
                        >
                          {st.replace("_", " ").toUpperCase()}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-brand-orange" /> Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Full Name</span>
                    <span className="font-bold text-slate-900">{selectedAppointment.customerName}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Direct Phone</span>
                    <a
                      href={`tel:${selectedAppointment.customerPhone}`}
                      className="font-bold text-brand-blue hover:underline"
                    >
                      {selectedAppointment.customerPhone}
                    </a>
                  </div>
                  {selectedAppointment.customerEmail && (
                    <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-slate-400 block text-[10px]">Email Address</span>
                      <a
                        href={`mailto:${selectedAppointment.customerEmail}`}
                        className="font-bold text-brand-blue hover:underline"
                      >
                        {selectedAppointment.customerEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle & Fitting Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-brand-orange" /> Vehicle &amp; Tyre Specifications
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Vehicle Registration</span>
                    <span className="inline-block bg-yellow-400 text-slate-900 font-black px-2 py-0.5 rounded text-xs tracking-wider border border-yellow-500 mt-1">
                      {selectedAppointment.vehicleReg}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Tyre Dimensions</span>
                    <span className="font-mono font-bold text-slate-900 block mt-1">
                      {selectedAppointment.tyreSize || "Not specified"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                    <span className="text-slate-400 block text-[10px]">Service Requested</span>
                    <span className="font-bold text-slate-900">{selectedAppointment.serviceType}</span>
                  </div>
                </div>
              </div>

              {/* Location & Navigation */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-orange" /> Breakdown Location &amp; Directions
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedAppointment.postcode}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        selectedAppointment.postcode + " " + (selectedAppointment.address || "")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-orange font-bold flex items-center gap-1 hover:underline text-[11px]"
                    >
                      Open in Google Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {selectedAppointment.address && (
                    <div className="text-slate-600">{selectedAppointment.address}</div>
                  )}
                  {selectedAppointment.locationNotes && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-slate-500 whitespace-pre-wrap font-sans">
                      <strong>Customer Location Notes:</strong>
                      <br />
                      {selectedAppointment.locationNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Status History Audit Trail */}
              {selectedAppointment.statusHistory && selectedAppointment.statusHistory.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-brand-orange" /> Workflow Audit Log
                  </h3>
                  <div className="space-y-2 text-xs">
                    {selectedAppointment.statusHistory.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 uppercase text-[10px]">
                            {h.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          by <span className="font-medium text-slate-700">{h.changedBy}</span>
                          {h.notes && <span> — {h.notes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAppointment(null)}
                className="font-bold text-xs"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
