"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one uppercase letter and one number.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          password,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to reset password.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Reset link is invalid or expired.");
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
              Set New Password
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500">
              Create a strong new password for your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Password Reset Completed!</h3>
                <p className="text-xs text-slate-600">All previous active sessions have been revoked. Redirecting to login...</p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Go to Login Now
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

                {!tokenFromUrl && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Recovery Token
                    </label>
                    <Input
                      type="text"
                      placeholder="Paste your reset token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    icon={<Lock className="h-4 w-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Repeat new password"
                    icon={<Lock className="h-4 w-4" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Updating Password...
                    </span>
                  ) : (
                    "Update Password & Sign In"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0C162D]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
