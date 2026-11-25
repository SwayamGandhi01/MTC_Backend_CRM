import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ShieldCheck, Database } from "lucide-react";
import Link from "next/link";

interface ModulePlaceholderProps {
  title: string;
  badge: string;
  description: string;
  databaseModel: string;
  plannedFeatures: string[];
  icon: React.ElementType;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  badge,
  description,
  databaseModel,
  plannedFeatures,
  icon: Icon,
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2 font-bold text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Button>
        </Link>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-brand-orange border border-orange-200">
          {badge}
        </span>
      </div>

      <Card className="border-slate-200/80 shadow-md">
        <CardHeader className="p-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-navy flex items-center justify-center text-white shadow-lg shadow-navy-950/10">
              <Icon className="h-7 w-7 text-brand-orange" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-brand-navy">
                {title}
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Database Model Mapping */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
            <Database className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Independent Database Architecture
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 font-mono">
                Model: {databaseModel}
              </p>
            </div>
          </div>

          {/* Planned Implementation Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-orange" /> Planned Module Features:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plannedFeatures.map((feat, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-100 bg-white shadow-xs text-xs font-medium text-slate-700 flex items-center gap-2.5"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Status Note */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <strong>Architecture Status:</strong> Completely independent Next.js App Router &amp; MongoDB Atlas CRM. All data operations will be performed via dedicated Next.js Route Handlers (<code className="font-mono bg-blue-100 px-1 py-0.5 rounded">/api/admin/*</code>) with Argon2id session authentication and RBAC authorization.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
