"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Timer,
  ShieldAlert,
  Eye,
  MousePointerClick,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { formatUKDateTime } from "@/lib/utils";
import { EmailPerformanceData } from "@/types/dashboard";

interface EmailPerformanceSectionProps {
  data?: EmailPerformanceData;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const EmailPerformanceSection: React.FC<EmailPerformanceSectionProps> = ({
  data,
  loading = false,
  error = null,
  onRetry,
}) => {
  const metrics = data?.metrics;
  const recentEmails = data?.recentEmails || [];

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
    if (s === "queued") {
      return (
        <Badge variant="outline" className="gap-1 bg-slate-50 text-slate-700 border-slate-200">
          <Clock className="h-3 w-3 text-slate-500" />
          Queued
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

  // Error State
  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-900">Failed to load Email Performance metrics</h3>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="gap-2 bg-white text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Query
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-navy flex items-center justify-center text-white shadow-2xs">
              <Mail className="h-4 w-4 text-brand-orange" />
            </div>
            <h2 className="text-lg font-black text-brand-navy tracking-tight">
              Resend Email Performance &amp; Delivery Health
            </h2>
            <span
              title="Verified MongoDB outbox with live Resend Webhook reconciliation"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-2xs"
            >
              Resend Provider
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Authoritative transactional email telemetry from MongoDB Atlas outbox and verified Resend webhooks
          </p>
        </div>

        <Link
          href="/emails"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-navy hover:underline transition-colors shrink-0"
        >
          <span>Open Full Email Centre</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Primary KPI Cards Grid (7 Key Delivery Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* 1. Total Sent */}
        <Card className="border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Sent</span>
              <Send className="h-3.5 w-3.5 text-brand-blue" />
            </div>
            {loading && !metrics ? (
              <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-black text-brand-navy">{metrics?.totalSent ?? 0}</div>
            )}
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Dispatched from CRM</p>
          </CardContent>
        </Card>

        {/* 2. Delivered */}
        <Card className="border-emerald-200/70 shadow-2xs bg-emerald-50/20">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-emerald-700 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Delivered</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            {loading && !metrics ? (
              <div className="h-6 w-12 bg-emerald-100 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-emerald-800">{metrics?.delivered ?? 0}</span>
                {metrics && metrics.totalSent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    {metrics.deliveryRate}%
                  </span>
                )}
              </div>
            )}
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Confirmed by webhook</p>
          </CardContent>
        </Card>

        {/* 3. Bounced */}
        <Card className="border-rose-200/70 shadow-2xs bg-rose-50/20">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-rose-700 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Bounced</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            {loading && !metrics ? (
              <div className="h-6 w-12 bg-rose-100 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-rose-800">{metrics?.bounced ?? 0}</span>
                {metrics && metrics.bounced > 0 && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                    {metrics.bounceRate}%
                  </span>
                )}
              </div>
            )}
            <p className="text-[10px] text-rose-600 font-medium mt-0.5">Mailbox or DNS bounce</p>
          </CardContent>
        </Card>

        {/* 4. Failed */}
        <Card className="border-red-200/70 shadow-2xs bg-red-50/20">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-red-700 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Failed</span>
              <XCircle className="h-3.5 w-3.5 text-red-600" />
            </div>
            {loading && !metrics ? (
              <div className="h-6 w-12 bg-red-100 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-black text-red-800">{metrics?.failed ?? 0}</div>
            )}
            <p className="text-[10px] text-red-600 font-medium mt-0.5">API / Provider rejection</p>
          </CardContent>
        </Card>

        {/* 5. Pending */}
        <Card className="border-amber-200/70 shadow-2xs bg-amber-50/20">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-amber-700 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </div>
            {loading && !metrics ? (
              <div className="h-6 w-12 bg-amber-100 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-black text-amber-800">{metrics?.pending ?? 0}</div>
            )}
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">In transit to inbox</p>
          </CardContent>
        </Card>

        {/* 6. Delayed */}
        <Card className="border-purple-200/70 shadow-2xs bg-purple-50/20">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-purple-700 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Delayed</span>
              <Timer className="h-3.5 w-3.5 text-purple-600" />
            </div>
            {loading && !metrics ? (
              <div className="h-6 w-12 bg-purple-100 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-black text-purple-800">{metrics?.delayed ?? 0}</div>
            )}
            <p className="text-[10px] text-purple-700 font-medium mt-0.5">ISP greylist / retry</p>
          </CardContent>
        </Card>

        {/* 7. Complaints */}
        <Card className="border-slate-200/80 shadow-2xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-600 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Complaints</span>
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            </div>
            {loading && !metrics ? (
              <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-black text-slate-800">{metrics?.complaints ?? 0}</div>
            )}
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Spam feedback loops</p>
          </CardContent>
        </Card>
      </div>

      {/* Optional Tracking Metrics (Rendered ONLY if tracking data is enabled and recorded in webhooks) */}
      {metrics?.hasTrackingData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Card className="border-purple-100 bg-purple-50/30">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  Open Rate (Resend Tracking)
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-black text-purple-950">{metrics.opens ?? 0} opened</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {metrics.openRate}%
                  </span>
                </div>
              </div>
              <Eye className="h-6 w-6 text-purple-400 shrink-0" />
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                  Click Rate (Resend Tracking)
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-black text-indigo-950">{metrics.clicks ?? 0} clicked</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {metrics.clickRate}%
                  </span>
                </div>
              </div>
              <MousePointerClick className="h-6 w-6 text-indigo-400 shrink-0" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Email Activity Table (Latest 5 Records) */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="py-3.5 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-brand-navy">Recent Transactional Email Activity</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Latest 5 dispatched customer alerts, booking confirmations and status updates
            </CardDescription>
          </div>
          <Link
            href="/emails"
            className="text-xs font-bold text-brand-navy hover:text-brand-blue flex items-center gap-1"
          >
            <span>View All</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-xs font-bold text-slate-600">Recipient</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Subject / Template</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">CRM Entity</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Sent Timestamp</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Delivery Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-600 text-right">Provider ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && recentEmails.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-28 bg-slate-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-48 bg-slate-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" /></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-20 bg-slate-100 rounded ml-auto animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : recentEmails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Mail className="h-6 w-6 text-slate-300" />
                      <p className="text-xs font-medium">No transactional emails recorded yet in MongoDB outbox.</p>
                      <p className="text-[11px] text-slate-400">Emails dispatched via website forms or booking workflows will stream here live.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentEmails.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Recipient */}
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {item.recipient}
                    </TableCell>

                    {/* Subject & Template */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-brand-navy max-w-xs truncate" title={item.subject}>
                          {item.subject}
                        </span>
                        {item.origin === "resend_import" && (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.2 rounded shrink-0">
                            Resend History
                          </span>
                        )}
                        {item.origin === "legacy" && (
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded shrink-0">
                            Legacy
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        template: {item.templateName}
                      </div>
                    </TableCell>

                    {/* CRM Entity */}
                    <TableCell>
                      {item.relatedRecord?.referenceId ? (
                        <Link
                          href={`/${item.relatedRecord.type === "appointment" ? "appointments" : item.relatedRecord.type === "enquiry" ? "enquiries" : "callbacks"}?search=${encodeURIComponent(item.relatedRecord.referenceId)}`}
                          className="font-mono text-xs font-bold text-brand-blue bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors inline-block"
                        >
                          {item.relatedRecord.referenceId}
                        </Link>
                      ) : item.relatedRecord?.type ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-600">
                          {item.relatedRecord.type}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Sent Timestamp */}
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                      {formatUKDateTime(item.sentAt)}
                    </TableCell>

                    {/* Delivery Status Badge */}
                    <TableCell>
                      {renderStatusBadge(item.status)}
                    </TableCell>

                    {/* Provider ID */}
                    <TableCell className="text-right">
                      {item.resendMessageId ? (
                        <span
                          title={item.resendMessageId}
                          className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded"
                        >
                          {item.resendMessageId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
