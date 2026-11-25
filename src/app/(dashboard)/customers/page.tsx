"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  ChevronRight,
  X,
  History,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CustomerItem {
  _id: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  postcode: string;
  address?: string;
  vehicleReg?: string;
  vehicles: string[];
  totalBookings: number;
  totalEnquiries: number;
  totalCallbacks: number;
  status: "active" | "vip" | "flagged" | "archived";
  lastActivityAt: string;
  createdAt: string;
}

interface CustomerHistoryData {
  customer: CustomerItem;
  history: {
    appointments: any[];
    enquiries: any[];
    callbacks: any[];
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerHistoryData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      } else {
        throw new Error(data.error?.message || "Failed to load customers");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const loadCustomerDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomerDetail(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-navy tracking-tight">
            Customers &amp; CRM Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Unified customer profiles linked across online bookings, contact inquiries, and tyre callbacks
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCustomers}
          disabled={loading}
          className="gap-2 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone number, vehicle reg plate, postcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-orange focus:bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-slate-200/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Postcode</th>
                <th className="py-3.5 px-4">Known Vehicles</th>
                <th className="py-3.5 px-4">Bookings</th>
                <th className="py-3.5 px-4">Enquiries</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-orange" />
                    Loading customers from MongoDB Atlas...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-red-600 bg-red-50">
                    {error}
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    No customers found. Submissions from website forms will automatically register here.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr
                    key={cust._id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => loadCustomerDetail(cust._id)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{cust.fullName}</div>
                      {cust.email && <div className="text-[10px] text-slate-400">{cust.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {cust.phoneNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 uppercase">
                      {cust.postcode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {cust.vehicles && cust.vehicles.length > 0 ? (
                          cust.vehicles.map((v, i) => (
                            <span
                              key={i}
                              className="bg-yellow-400 text-slate-900 font-black px-1.5 py-0.5 rounded text-[10px] border border-yellow-500"
                            >
                              {v}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-navy">
                      {cust.totalBookings || 0}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-600">
                      {cust.totalEnquiries || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {cust.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(cust.lastActivityAt || cust.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadCustomerDetail(cust._id)}
                        className="h-7 text-xs font-bold gap-1 text-brand-navy hover:text-brand-orange"
                      >
                        Profile <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Full History Slide-Over Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-orange tracking-widest block">
                  Customer Profile &amp; Submission History
                </span>
                <h2 className="text-lg font-black text-white mt-1">
                  {customerDetail?.customer.fullName || "Loading..."}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail || !customerDetail ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-orange" />
                Retrieving customer records and past submissions...
              </div>
            ) : (
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* Contact Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black">Phone</span>
                      <a
                        href={`tel:${customerDetail.customer.phoneNumber}`}
                        className="font-bold text-brand-blue block text-sm hover:underline"
                      >
                        {customerDetail.customer.phoneNumber}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black">Postcode</span>
                      <span className="font-bold text-slate-900 block text-sm uppercase">
                        {customerDetail.customer.postcode}
                      </span>
                    </div>
                    {customerDetail.customer.email && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-black">Email</span>
                        <a
                          href={`mailto:${customerDetail.customer.email}`}
                          className="font-bold text-brand-blue block hover:underline"
                        >
                          {customerDetail.customer.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lifetime Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-xl font-black text-brand-blue block">
                      {customerDetail.history.appointments.length}
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-500">
                      Bookings
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-xl font-black text-purple-700 block">
                      {customerDetail.history.enquiries.length}
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-500">
                      Enquiries
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="text-xl font-black text-amber-700 block">
                      {customerDetail.history.callbacks.length}
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-500">
                      Callbacks
                    </span>
                  </div>
                </div>

                {/* Submissions: Appointments */}
                <div className="space-y-2">
                  <span className="font-black uppercase text-slate-400 tracking-wider block text-[10px]">
                    Booking Appointments ({customerDetail.history.appointments.length})
                  </span>
                  {customerDetail.history.appointments.length === 0 ? (
                    <p className="text-slate-400 italic">No bookings recorded.</p>
                  ) : (
                    customerDetail.history.appointments.map((appt: any) => (
                      <div
                        key={appt._id}
                        className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-brand-blue">
                            {appt.referenceId}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100">
                            {appt.status}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800">
                          {appt.serviceType} • {appt.tyreSize || "Standard"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Vehicle: <strong className="text-slate-700">{appt.vehicleReg}</strong> •{" "}
                          {new Date(appt.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Submissions: Enquiries */}
                <div className="space-y-2">
                  <span className="font-black uppercase text-slate-400 tracking-wider block text-[10px]">
                    Inbound Enquiries ({customerDetail.history.enquiries.length})
                  </span>
                  {customerDetail.history.enquiries.length === 0 ? (
                    <p className="text-slate-400 italic">No contact enquiries recorded.</p>
                  ) : (
                    customerDetail.history.enquiries.map((enq: any) => (
                      <div
                        key={enq._id}
                        className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-purple-700">
                            {enq.referenceId}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                            {enq.status}
                          </span>
                        </div>
                        <div className="text-slate-700 font-sans">{enq.message}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(enq.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="font-bold text-xs"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
