import React from "react";
import { LoginForm } from "@/components/forms/LoginForm";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // If already authenticated, redirect straight to dashboard
  const session = await getCurrentSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0C162D] overflow-hidden">
      {/* Subtle decorative background gradient */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-blue/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
