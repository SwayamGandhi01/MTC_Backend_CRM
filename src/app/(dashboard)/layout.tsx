import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionContext = await getCurrentSession();

  // Route protection
  if (!sessionContext) {
    redirect("/login");
  }

  const { user, permissions } = sessionContext;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar with real-time permission filtering */}
      <Sidebar className="hidden lg:flex" userPermissions={permissions} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
          }}
          userPermissions={permissions}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
