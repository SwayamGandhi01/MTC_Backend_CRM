import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0C162D] text-white">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="h-16 w-16 bg-red-500/10 text-brand-orange border border-brand-orange/20 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black">404 – Page Not Found</h1>
        <p className="text-xs text-slate-400">
          The requested administration resource or route does not exist.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button className="bg-brand-orange hover:bg-orange-600 font-bold text-xs text-white">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
