"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await response.json();
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0C162D] overflow-hidden">
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full shadow-2xl border-slate-200/80 bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 p-2 shadow-lg shadow-navy-950/20 border border-slate-800">
              <Image
                src="/images/mtc-logo.webp"
                alt="Mobile Tyre Champions"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-black text-brand-navy">
              Reset Password
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500">
              Enter your work email to receive password recovery instructions
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Recovery Instructions Dispatched</h3>
                <p className="text-xs text-slate-600">
                  If an active account exists for <strong>{email}</strong>, a recovery link has been dispatched. Please check your inbox and junk folder.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <div className="font-medium">{errorMessage}</div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Work Email
                  </label>
                  <Input
                    type="email"
                    placeholder="name@mobiletyrechampions.com"
                    icon={<Mail className="h-4 w-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-brand-navy hover:bg-brand-navyLight font-bold text-sm text-white"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Recovery Link...
                    </span>
                  ) : (
                    "Send Password Recovery Link"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-orange"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
