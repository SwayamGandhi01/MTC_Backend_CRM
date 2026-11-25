"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  Send,
  Eye,
} from "lucide-react";
import { formatUKDateTime } from "@/lib/utils";

interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  templateName: string;
  status: string;
  category?: string;
  referenceId?: string;
  resendMessageId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  errorMessage?: string;
  deliveryTimeline: Array<{ event: string; timestamp: string; data?: any }>;
  sentAt: string;
}

interface EmailMetrics {
  total: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  deliveryRate: number;
}

export default function EmailCentrePage() {
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [metrics, setMetrics] = useState<EmailMetrics>({
    total: 0,
    delivered: 0,
    bounced: 0,
    failed: 0,
    opened: 0,
    deliveryRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/emails?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setEmails(json.data.emails || []);
          setMetrics(json.data.metrics || metrics);
        }
      }
    } catch (err) {
      console.error("[Email Centre Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered" || s === "opened" || s === "clicked") {
      return (
        <Badge variant="completed" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          {status}
        </Badge>
      );
    }
    if (s === "sent" || s === "queued") {
      return (
        <Badge variant="pending" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Send className="h-3 w-3 text-blue-600" />
          {status}
        </Badge>
      );
    }
    if (s === "bounced" || s === "complained") {
      return (
        <Badge variant="rejected" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          {status}
        </Badge>
      );
    }
    return (
      <Badge variant="rejected" className="gap-1 bg-rose-50 text-rose-700 border-rose-200">
        <XCircle className="h-3 w-3 text-rose-600" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 pb-10 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-brand-navy tracking-tight">
              Email Centre & Delivery Analytics
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-navy text-white px-2.5 py-0.5 rounded-full">
              Resend Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Real-time transactional email outbox, Resend webhook event tracking, and delivery timelines
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEmails}
          disabled={loading}
          className="gap-2 text-xs font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Outbox
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dispatched</span>
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-brand-navy">
                <Mail className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-brand-navy">{metrics.total}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">All customer and admin notifications</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-emerald-700">{metrics.delivered}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Confirmed delivered to inbox</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Rate</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Send className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-blue-700">{metrics.deliveryRate}%</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Successful delivery percentage</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bounced / Failed</span>
              <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-rose-700">{metrics.bounced + metrics.failed}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Actionable delivery failures</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="col-span-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle>Transactional Outbox Logs</CardTitle>
            <CardDescription>
              Chronological log of all customer booking receipts, dispatch alerts, and internal notifications
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
              {["all", "delivered", "sent", "bounced", "failed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                    statusFilter === tab
                      ? "bg-white text-brand-navy shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <Input
                type="text"
                placeholder="Search recipient, ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-3.5 w-3.5" />}
                className="h-8 text-xs bg-slate-50 focus-visible:bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject & Template</TableHead>
                <TableHead>Related Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resend Message ID</TableHead>
                <TableHead>Dispatched At</TableHead>
                <TableHead className="text-right">Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-32 bg-slate-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-44 bg-slate-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-3 w-28 bg-slate-100 rounded font-mono animate-pulse" /></TableCell>
                    <TableCell><div className="h-3 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell className="text-right"><div className="h-7 w-14 bg-slate-100 rounded ml-auto animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-600">No email logs found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Transactional customer receipts, password resets, and dispatch notices sent via Resend will appear here in real-time.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => (
                  <TableRow key={email.id} className="hover:bg-slate-50/80">
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">{email.recipient}</div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                        {email.category || "customer"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-slate-800 text-xs">{email.subject}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        template: {email.templateName}
                      </div>
                    </TableCell>

                    <TableCell>
                      {email.referenceId ? (
                        <span className="font-mono text-xs font-bold text-brand-navy bg-slate-100 px-2 py-0.5 rounded">
                          {email.referenceId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell>{renderStatusBadge(email.status)}</TableCell>

                    <TableCell>
                      {email.resendMessageId ? (
                        <span className="font-mono text-[11px] text-slate-500">
                          {email.resendMessageId.substring(0, 16)}...
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {formatUKDateTime(email.sentAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmail(email)}
                        className="h-8 text-xs font-bold text-brand-blue hover:text-brand-navy gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delivery Timeline Modal / Drawer */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-navy">Delivery Timeline Inspector</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedEmail.resendMessageId || selectedEmail.id}</p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Recipient:</span>
                  <span className="font-bold text-slate-900">{selectedEmail.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Subject:</span>
                  <span className="font-semibold text-slate-800">{selectedEmail.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span>{renderStatusBadge(selectedEmail.status)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Event History</h4>
                {selectedEmail.deliveryTimeline && selectedEmail.deliveryTimeline.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-2">
                    {selectedEmail.deliveryTimeline.map((evt, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-brand-blue" />
                        <div className="font-bold text-slate-800 capitalize">{evt.event}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{formatUKDateTime(evt.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No webhook lifecycle events recorded yet for this message.</p>
                )}
              </div>

              {selectedEmail.errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <strong>Delivery Failure:</strong> {selectedEmail.errorMessage}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setSelectedEmail(null)} className="text-xs font-bold">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
