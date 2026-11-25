"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Phone,
  Search,
  RefreshCw,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  X,
  PhoneCall,
  Disc,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EnquiryItem {
  _id: string;
  referenceId: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  postcode: string;
  serviceRequired: string;
  message: string;
  vehicleReg?: string;
  status: "new" | "contacted" | "quoted" | "converted" | "closed";
  notes?: string;
  sourcePage?: string;
  createdAt: string;
}

interface CallbackItem {
  _id: string;
  referenceId: string;
  mobileNumber: string;
  postcode: string;
  regNumber?: string;
  width?: string;
  height?: string;
  diameter?: string;
  brand?: string;
  season?: string;
  title?: string;
  notes?: string;
  status: "pending" | "called" | "booked" | "no_answer" | "closed";
  sourcePage?: string;
  createdAt: string;
}

const ENQUIRY_STATUSES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  new: { label: "New Lead", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  contacted: { label: "Contacted", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  quoted: { label: "Quote Sent", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  converted: { label: "Converted", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" },
};

const CALLBACK_STATUSES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "Awaiting Call", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  called: { label: "Called", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  booked: { label: "Booked", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  no_answer: { label: "No Answer", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" },
};

export default function EnquiriesPage() {
  const [activeTab, setActiveTab] = useState<"enquiries" | "callbacks">("enquiries");
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [callbacks, setCallbacks] = useState<CallbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected item drawer
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [selectedCallback, setSelectedCallback] = useState<CallbackItem | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "enquiries") {
        const params = new URLSearchParams({ status: statusFilter });
        if (search.trim()) params.append("search", search.trim());
        const res = await fetch(`/api/admin/enquiries?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setEnquiries(data.data || []);
        } else {
          throw new Error(data.error?.message || "Failed to load enquiries");
        }
      } else {
        const params = new URLSearchParams({ status: statusFilter });
        if (search.trim()) params.append("search", search.trim());
        const res = await fetch(`/api/admin/callbacks?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setCallbacks(data.data || []);
        } else {
          throw new Error(data.error?.message || "Failed to load callbacks");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateEnquiryStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries((prev) => prev.map((item) => (item._id === id ? data.data : item)));
        if (selectedEnquiry?._id === id) setSelectedEnquiry(data.data);
      }
    } catch (e: any) {
      alert(`Error updating: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const updateCallbackStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/callbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCallbacks((prev) => prev.map((item) => (item._id === id ? data.data : item)));
        if (selectedCallback?._id === id) setSelectedCallback(data.data);
      }
    } catch (e: any) {
      alert(`Error updating: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-navy tracking-tight">
            Enquiries &amp; Callbacks Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Respond to website contact quote requests and automated Tyre Finder callbacks
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-2 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => {
            setActiveTab("enquiries");
            setStatusFilter("all");
          }}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "enquiries"
              ? "border-brand-orange text-brand-navy"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-brand-orange" />
          Contact Enquiries ({enquiries.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("callbacks");
            setStatusFilter("all");
          }}
          className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "callbacks"
              ? "border-brand-orange text-brand-navy"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <PhoneCall className="h-4 w-4 text-brand-orange" />
          Tyre Finder Callbacks ({callbacks.length})
        </button>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === "enquiries"
                    ? "Search enquiries by name, phone, postcode, ref..."
                    : "Search callbacks by mobile, reg, postcode, ref..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange focus:bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="all">All Statuses</option>
              {activeTab === "enquiries" ? (
                <>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="called">Called</option>
                  <option value="booked">Booked</option>
                  <option value="no_answer">No Answer</option>
                  <option value="closed">Closed</option>
                </>
              )}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card className="border-slate-200/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "enquiries" ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ref ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Postcode</th>
                  <th className="py-3.5 px-4">Service Required</th>
                  <th className="py-3.5 px-4">Message Preview</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {loading && enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-orange" />
                      Loading enquiries from MongoDB Atlas...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-red-600 bg-red-50">
                      {error}
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No customer enquiries found.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enq) => {
                    const badge = ENQUIRY_STATUSES[enq.status] || ENQUIRY_STATUSES.new;
                    return (
                      <tr
                        key={enq._id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedEnquiry(enq)}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-100">
                            {enq.referenceId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{enq.fullName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {enq.phoneNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 uppercase">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-brand-orange" />
                            {enq.postcode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {enq.serviceRequired}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                          {enq.message}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(enq.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEnquiry(enq)}
                            className="h-7 text-xs font-bold gap-1 text-brand-navy hover:text-brand-orange"
                          >
                            View <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ref ID</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Postcode</th>
                  <th className="py-3.5 px-4">Reg Plate</th>
                  <th className="py-3.5 px-4">Tyre Dimension</th>
                  <th className="py-3.5 px-4">Brand / Season</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {loading && callbacks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-orange" />
                      Loading callbacks from MongoDB Atlas...
                    </td>
                  </tr>
                ) : callbacks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No callback requests found.
                    </td>
                  </tr>
                ) : (
                  callbacks.map((cb) => {
                    const badge = CALLBACK_STATUSES[cb.status] || CALLBACK_STATUSES.pending;
                    return (
                      <tr
                        key={cb._id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedCallback(cb)}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-100">
                            {cb.referenceId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <a
                            href={`tel:${cb.mobileNumber}`}
                            className="font-bold text-brand-navy flex items-center gap-1.5 hover:text-brand-orange"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3.5 w-3.5 text-brand-orange" />
                            {cb.mobileNumber}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 uppercase">
                          {cb.postcode}
                        </td>
                        <td className="py-3.5 px-4">
                          {cb.regNumber ? (
                            <span className="bg-yellow-400 text-slate-900 font-black px-2 py-0.5 rounded text-[11px] border border-yellow-500">
                              {cb.regNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {cb.width && cb.height && cb.diameter
                            ? `${cb.width}/${cb.height} R${cb.diameter}`
                            : cb.title || "Custom size"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {cb.brand || "Any brand"} {cb.season ? `(${cb.season})` : ""}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCallback(cb)}
                            className="h-7 text-xs font-bold gap-1 text-brand-navy hover:text-brand-orange"
                          >
                            Review <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Enquiry Detail Drawer */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-black bg-brand-orange text-white px-2 py-0.5 rounded">
                  {selectedEnquiry.referenceId}
                </span>
                <h2 className="text-lg font-black text-white mt-2">
                  {selectedEnquiry.fullName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Quick Status Update */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-black uppercase text-slate-500 block text-[10px]">
                  Triage Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {["new", "contacted", "quoted", "converted", "closed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateEnquiryStatus(selectedEnquiry._id, st)}
                      disabled={updating || selectedEnquiry.status === st}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                        selectedEnquiry.status === st
                          ? "bg-brand-navy text-white border-brand-navy"
                          : "bg-white text-slate-700 hover:border-brand-orange"
                      }`}
                    >
                      {st.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <span className="font-black uppercase text-slate-400 tracking-wider block text-[10px]">
                  Contact Information
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Phone</span>
                    <a
                      href={`tel:${selectedEnquiry.phoneNumber}`}
                      className="font-bold text-brand-blue hover:underline"
                    >
                      {selectedEnquiry.phoneNumber}
                    </a>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Postcode</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selectedEnquiry.postcode}
                    </span>
                  </div>
                  {selectedEnquiry.email && (
                    <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                      <span className="text-slate-400 block text-[10px]">Email</span>
                      <a
                        href={`mailto:${selectedEnquiry.email}`}
                        className="font-bold text-brand-blue hover:underline"
                      >
                        {selectedEnquiry.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Inquiry Message */}
              <div className="space-y-2">
                <span className="font-black uppercase text-slate-400 tracking-wider block text-[10px]">
                  Message / Requirements
                </span>
                <div className="p-4 bg-slate-50 rounded-xl text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                  <div className="font-bold text-slate-900 mb-2">
                    Service: {selectedEnquiry.serviceRequired}
                  </div>
                  {selectedEnquiry.message}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEnquiry(null)}
                className="font-bold text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Callback Detail Drawer */}
      {selectedCallback && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-black bg-brand-orange text-white px-2 py-0.5 rounded">
                  {selectedCallback.referenceId}
                </span>
                <h2 className="text-lg font-black text-white mt-2">
                  Tyre Callback Request
                </h2>
              </div>
              <button
                onClick={() => setSelectedCallback(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Quick Status Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-black uppercase text-slate-500 block text-[10px]">
                  Dispatch Callback Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {["pending", "called", "booked", "no_answer", "closed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateCallbackStatus(selectedCallback._id, st)}
                      disabled={updating || selectedCallback.status === st}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                        selectedCallback.status === st
                          ? "bg-brand-navy text-white border-brand-navy"
                          : "bg-white text-slate-700 hover:border-brand-orange"
                      }`}
                    >
                      {st.replace("_", " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Call Trigger */}
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 block">
                    Customer Mobile Number
                  </span>
                  <span className="text-lg font-black text-slate-900 block mt-0.5">
                    {selectedCallback.mobileNumber}
                  </span>
                </div>
                <a
                  href={`tel:${selectedCallback.mobileNumber}`}
                  className="bg-brand-orange text-white px-4 py-2.5 rounded-xl font-black text-xs hover:bg-orange-600 flex items-center gap-1.5 shadow-sm"
                >
                  <Phone className="h-4 w-4" /> Call Now
                </a>
              </div>

              {/* Tyre Search Specs */}
              <div className="space-y-2">
                <span className="font-black uppercase text-slate-400 tracking-wider block text-[10px]">
                  Requested Tyre Specifications
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Postcode</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selectedCallback.postcode}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Vehicle Reg</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selectedCallback.regNumber || "None entered"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                    <span className="text-slate-400 block text-[10px]">Tyre Dimension</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedCallback.width && selectedCallback.height && selectedCallback.diameter
                        ? `${selectedCallback.width}/${selectedCallback.height} R${selectedCallback.diameter}`
                        : selectedCallback.title || "Standard Specification"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Brand</span>
                    <span className="font-bold text-slate-900">
                      {selectedCallback.brand || "Any"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Season</span>
                    <span className="font-bold text-slate-900">
                      {selectedCallback.season || "Summer"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCallback(null)}
                className="font-bold text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
