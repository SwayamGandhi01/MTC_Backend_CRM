"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Copy,
  Check,
  Calendar,
  Filter,
  ShieldCheck,
  History,
  Radio,
  Timer,
  MousePointerClick,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatUKDateTime } from "@/lib/utils";

interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  templateName: string;
  status: string;
  origin: "crm" | "resend_import" | "legacy";
  sender?: string;
  category?: string;
  referenceId?: string;
  resendMessageId?: string;
  providerMessageId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  errorMessage?: string;
  deliveryTimeline: Array<{ event: string; timestamp: string; data?: any }>;
  metadata?: Record<string, any>;
  sentAt: string;
  createdAt: string;
}

interface EmailMetrics {
  total: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  clicked?: number;
  delayed?: number;
  pending?: number;
  complaints?: number;
  deliveryRate: number;
}

interface SyncState {
  syncId?: string;
  status?: "in_progress" | "completed" | "failed" | "interrupted";
  startedAt?: string;
  completedAt?: string;
  totalDiscovered?: number;
  totalImported?: number;
  totalUpdated?: number;
  totalSkipped?: number;
  totalFailed?: number;
  hasMore?: boolean;
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
  const [originFilter, setOriginFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Synchronization state
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Fetch emails from MongoDB Atlas
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (originFilter !== "all") params.append("origin", originFilter);
      if (search) params.append("search", search);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/admin/emails?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setEmails(json.data.emails || []);
          setMetrics(json.data.metrics || metrics);
          if (json.data.pagination) {
            setPagination({
              total: json.data.pagination.total,
              pages: json.data.pagination.pages || 1,
            });
          }
        }
      }
    } catch (err) {
      console.error("[Email Centre Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, originFilter, search, startDate, endDate, page]);

  // Fetch latest sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/emails/sync", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSyncState(json.data);
          if (json.data.status === "in_progress") {
            setIsSyncing(true);
          } else {
            setIsSyncing(false);
          }
        }
      }
    } catch (err) {
      console.warn("[Sync Status Error]", err);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    fetchSyncStatus();
  }, [fetchEmails, fetchSyncStatus]);

  // Trigger historical Resend synchronization
  const handleTriggerSync = async (resume = false) => {
    setIsSyncing(true);
    setSyncMessage("Connecting to Resend API and importing historical emails...");
    try {
      const res = await fetch("/api/admin/emails/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSyncMessage(
          `Sync Complete: ${json.data.totalImported} imported, ${json.data.totalUpdated} updated, ${json.data.totalSkipped} duplicate records reconciled.`
        );
        fetchEmails();
        fetchSyncStatus();
      } else {
        setSyncMessage(`Sync Warning: ${json.error || "Import incomplete."}`);
      }
    } catch (err: any) {
      setSyncMessage(`Sync Failed: ${err?.message || "Network error"}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 8000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const renderStatusBadge = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s === "delivered") {
      return (
        <Badge variant="completed" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Delivered
        </Badge>
      );
    }
    if (s === "opened") {
      return (
        <Badge variant="completed" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
          <Eye className="h-3 w-3 text-purple-600" />
          Opened
        </Badge>
      );
    }
    if (s === "clicked") {
      return (
        <Badge variant="completed" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
          <MousePointerClick className="h-3 w-3 text-indigo-600" />
          Clicked
        </Badge>
      );
    }
    if (s === "sent") {
      return (
        <Badge variant="pending" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Send className="h-3 w-3 text-blue-600" />
          Sent
        </Badge>
      );
    }
    if (s === "queued" || s === "scheduled") {
      return (
        <Badge variant="outline" className="gap-1 bg-slate-50 text-slate-700 border-slate-200">
          <Clock className="h-3 w-3 text-slate-500" />
          {status}
        </Badge>
      );
    }
    if (s === "delayed") {
      return (
        <Badge variant="pending" className="gap-1 bg-amber-50 text-amber-800 border-amber-300">
          <Timer className="h-3 w-3 text-amber-600" />
          Delayed
        </Badge>
      );
    }
    if (s === "bounced") {
      return (
        <Badge variant="rejected" className="gap-1 bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 text-red-600" />
          Bounced
        </Badge>
      );
    }
    if (s === "complained") {
      return (
        <Badge variant="rejected" className="gap-1 bg-orange-50 text-orange-800 border-orange-300">
          <ShieldAlert className="h-3 w-3 text-orange-600" />
          Complaint
        </Badge>
      );
    }
    return (
      <Badge variant="rejected" className="gap-1 bg-rose-50 text-rose-700 border-rose-200">
        <XCircle className="h-3 w-3 text-rose-600" />
        {status || "Failed"}
      </Badge>
    );
  };

  const renderOriginBadge = (origin: string) => {
    switch (origin) {
      case "resend_import":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
            <History className="h-2.5 w-2.5 text-purple-600" />
            Resend History
          </span>
        );
      case "legacy":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            Legacy System
          </span>
        );
      case "crm":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
            <Radio className="h-2.5 w-2.5 text-blue-600" />
            CRM Live
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-7xl">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-navy flex items-center justify-center text-white shadow-2xs">
              <Mail className="h-4 w-4 text-brand-orange" />
            </div>
            <h1 className="text-2xl font-black text-brand-navy tracking-tight">
              Email Centre &amp; Delivery Telemetry
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
              Resend Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Authoritative transactional email repository combining live CRM sends, verified Resend webhooks, and complete historical Resend imports
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleTriggerSync(false)}
            disabled={isSyncing}
            className="gap-2 bg-brand-navy hover:bg-brand-navyLight text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-brand-orange" : ""}`} />
            {isSyncing ? "Syncing Resend..." : "Sync Resend History"}
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-blue-900 text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="h-4 w-4 text-brand-blue animate-pulse shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-xs text-blue-600 hover:text-blue-900 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sync Metadata Snapshot */}
      {syncState && syncState.completedAt && (
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-100/70 border border-slate-200/80 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Last Resend Synchronization:{" "}
              <strong className="text-slate-700" suppressHydrationWarning>
                {formatUKDateTime(syncState.completedAt)}
              </strong>{" "}
              • Total Discovered: <strong>{syncState.totalDiscovered ?? 0}</strong> • Imported:{" "}
              <strong>{syncState.totalImported ?? 0}</strong> • Reconciled:{" "}
              <strong>{syncState.totalUpdated ?? 0}</strong>
            </span>
          </div>
          {syncState.hasMore && (
            <button
              onClick={() => handleTriggerSync(true)}
              className="text-xs font-bold text-brand-blue hover:underline ml-2"
            >
              Resume Additional Pages
            </button>
          )}
        </div>
      )}

      {/* Metrics Row (MongoDB Authoritative Snapshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Recorded
            </div>
            <div className="text-2xl font-black text-brand-navy">{metrics.total}</div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">MongoDB EmailLog store</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/70 shadow-2xs bg-emerald-50/20">
          <CardContent className="p-4">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
              Delivered
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800">{metrics.delivered}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                {metrics.deliveryRate}%
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Verified deliveries</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200/70 shadow-2xs bg-purple-50/20">
          <CardContent className="p-4">
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">
              Opened
            </div>
            <div className="text-2xl font-black text-purple-900">{metrics.opened}</div>
            <p className="text-[10px] text-purple-600 font-medium mt-0.5">Resend pixel opens</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200/70 shadow-2xs bg-rose-50/20">
          <CardContent className="p-4">
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
              Bounces
            </div>
            <div className="text-2xl font-black text-rose-800">{metrics.bounced}</div>
            <p className="text-[10px] text-rose-600 font-medium mt-0.5">Hard / soft bounces</p>
          </CardContent>
        </Card>

        <Card className="border-red-200/70 shadow-2xs bg-red-50/20">
          <CardContent className="p-4">
            <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">
              Failed
            </div>
            <div className="text-2xl font-black text-red-800">{metrics.failed}</div>
            <p className="text-[10px] text-red-600 font-medium mt-0.5">Dispatch rejections</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/70 shadow-2xs bg-amber-50/20">
          <CardContent className="p-4">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
              Pending / In Transit
            </div>
            <div className="text-2xl font-black text-amber-800">{metrics.pending ?? 0}</div>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card with Multi-Source & Status Filters */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-brand-navy">All Email Logs</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Authoritative history across website forms, CRM automation, and historical Resend imports
              </CardDescription>
            </div>

            {/* Source / Origin Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { id: "all", label: "All Sources" },
                { id: "crm", label: "CRM Live" },
                { id: "resend_import", label: "Resend Import" },
                { id: "legacy", label: "Legacy" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setOriginFilter(opt.id);
                    setPage(1);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    originFilter === opt.id
                      ? "bg-white text-brand-navy shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filter Bar: Status Tabs, Date Filter, Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                "all",
                "Delivered",
                "Sent",
                "Opened",
                "Clicked",
                "Delayed",
                "Bounced",
                "Failed",
                "Complained",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setStatusFilter(tab);
                    setPage(1);
                  }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize transition-all ${
                    statusFilter === tab
                      ? "bg-brand-navy text-white shadow-2xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search & Date Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44 sm:w-56">
                <Input
                  type="text"
                  placeholder="Search recipient, ref, ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  icon={<Search className="h-3.5 w-3.5" />}
                  className="h-8 text-xs bg-slate-50 focus-visible:bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-xs w-32 bg-slate-50"
                  title="Filter from sent date"
                />
                <span className="text-xs text-slate-400">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-xs w-32 bg-slate-50"
                  title="Filter to sent date"
                />
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setPage(1);
                    }}
                    className="h-8 px-2 text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Clear Dates
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead className="text-xs font-bold text-slate-600">Recipient</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Subject / Template</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Source</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Resend Message ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Dispatched At</TableHead>
                <TableHead className="text-xs font-bold text-slate-600 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
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
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Mail className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No email logs matched your criteria.</p>
                      <p className="text-xs text-slate-400">
                        {originFilter !== "all" || statusFilter !== "all" || search
                          ? "Try clearing filters to display all transactional records."
                          : "Click 'Sync Resend History' above to import historical emails from your Resend account."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => (
                  <TableRow key={email.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-slate-800 break-all max-w-[240px]">
                      {email.recipient}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-bold text-brand-navy max-w-xs truncate" title={email.subject}>
                        {email.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        template: {email.templateName}
                      </div>
                    </TableCell>

                    <TableCell>{renderOriginBadge(email.origin)}</TableCell>

                    <TableCell>{renderStatusBadge(email.status)}</TableCell>

                    <TableCell>
                      {email.resendMessageId ? (
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {email.resendMessageId.substring(0, 16)}...
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 whitespace-nowrap" suppressHydrationWarning>
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

          {/* Pagination Navigation */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page <strong>{page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total emails)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="gap-1 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Email Detail & Timeline Inspector Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-brand-navy">Email Inspector</h3>
                  {renderOriginBadge(selectedEmail.origin)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedEmail.resendMessageId || selectedEmail.id}
                  </span>
                  {selectedEmail.resendMessageId && (
                    <button
                      onClick={() => copyToClipboard(selectedEmail.resendMessageId!)}
                      title="Copy Resend Message ID"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Origin Clarification Banner */}
            {selectedEmail.origin === "resend_import" && (
              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-900">
                <div className="flex items-center gap-2 font-bold mb-0.5">
                  <History className="h-3.5 w-3.5 text-purple-600" />
                  <span>Historical Resend Email Import</span>
                </div>
                <p className="text-[11px] text-purple-700">
                  This email was discovered and imported directly from your Resend account history. The listing API supplies the latest delivery status verified by the provider.
                </p>
              </div>
            )}

            {selectedEmail.origin === "legacy" && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800">
                <strong>Legacy CRM Record:</strong> Retained from previous system records without provider message ID.
              </div>
            )}

            {/* Email Metadata Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-medium shrink-0">Recipient:</span>
                <span className="font-mono font-bold text-slate-900 break-all text-right select-all">
                  {selectedEmail.recipient}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sender:</span>
                <span className="text-slate-700 font-mono">{selectedEmail.sender || "info@mobiletyrechampions.com"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Subject:</span>
                <span className="font-semibold text-slate-800 text-right">{selectedEmail.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Template:</span>
                <span className="font-mono text-slate-700">{selectedEmail.templateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sent At:</span>
                <span className="text-slate-700 font-medium" suppressHydrationWarning>
                  {formatUKDateTime(selectedEmail.sentAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Authoritative Status:</span>
                <span>{renderStatusBadge(selectedEmail.status)}</span>
              </div>
              {selectedEmail.referenceId && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Related CRM Reference:</span>
                  <Link
                    href={`/${selectedEmail.relatedEntityType === "appointment" ? "appointments" : selectedEmail.relatedEntityType === "enquiry" ? "enquiries" : "callbacks"}?search=${encodeURIComponent(selectedEmail.referenceId)}`}
                    className="font-mono font-bold text-brand-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                  >
                    {selectedEmail.referenceId}
                  </Link>
                </div>
              )}
            </div>

            {/* Lifecycle Event History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Event Timeline &amp; Webhook Telemetry
              </h4>
              {selectedEmail.deliveryTimeline && selectedEmail.deliveryTimeline.length > 0 ? (
                <div className="space-y-3 border-l-2 border-slate-200 pl-4 ml-2">
                  {selectedEmail.deliveryTimeline.map((evt, idx) => {
                    const isHistorical = evt.data?.historicalImport || evt.event.startsWith("resend.");
                    return (
                      <div key={idx} className="relative text-xs">
                        <div
                          className={`absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                            isHistorical ? "bg-purple-600" : "bg-emerald-600"
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 capitalize">{evt.event}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              isHistorical
                                ? "bg-purple-100 text-purple-700"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isHistorical ? "Historical Sync" : "Live Webhook Verified"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5" suppressHydrationWarning>
                          {formatUKDateTime(evt.timestamp)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No webhook lifecycle events recorded yet for this message.</p>
              )}
            </div>

            {selectedEmail.origin === "resend_import" && selectedEmail.deliveryTimeline.length <= 1 && (
              <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                ℹ️ Note: Resend email listing API provides the latest delivery event. Granular per-hop event timestamps prior to live webhook setup were not retained by the provider.
              </p>
            )}

            {selectedEmail.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <strong>Delivery Failure:</strong> {selectedEmail.errorMessage}
              </div>
            )}

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
