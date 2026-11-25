import React from "react";
import { getDashboardOverviewData } from "@/lib/services/dashboard.service";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DashboardOverviewData } from "@/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Server-Rendered Dashboard Overview Page
 * 
 * Fetches 100% authoritative data directly from MongoDB Atlas on the server.
 * Renders HTML with real numbers and zero mock/sample data flashes.
 */
export default async function DashboardOverviewPage() {
  const sessionContext = await getCurrentSession();
  if (!sessionContext) {
    redirect("/login");
  }

  let initialData: DashboardOverviewData | null = null;
  let initialError: string | null = null;

  try {
    initialData = await getDashboardOverviewData();
  } catch (err: any) {
    console.error("[Dashboard Page] Failed to fetch server-side stats:", err?.message || err);
    initialError = "Unable to retrieve live dashboard metrics from database.";
  }

  return (
    <DashboardClientView
      initialData={initialData}
      initialError={initialError}
    />
  );
}
