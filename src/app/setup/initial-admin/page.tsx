"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type SetupStep = "loading" | "form" | "mfa" | "recovery" | "closed";

export default function InitialAdminSetupPage() {
  const [step, setStep] = useState<SetupStep>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // MFA fields
  const [challengeToken, setChallengeToken] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Check eligibility on mount
  useEffect(() => {
    async function checkEligibility() {
      try {
        const res = await fetch("/api/auth/setup/initial-admin");
        const data = await res.json();
        if (data.eligible) {
          setStep("form");
        } else {
          setStep("closed");
        }
      } catch {
        setStep("form");
      }
    }
    checkEligibility();
  }, []);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passedCriteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel =
    passedCriteria <= 2 ? "Weak" : passedCriteria <= 4 ? "Good" : "Strong";
  const strengthColor =
    passedCriteria <= 2
      ? "bg-red-500"
      : passedCriteria <= 4
      ? "bg-amber-500"
      : "bg-emerald-500";

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (passedCriteria < 5) {
      setErrorMessage("Please ensure your password satisfies all 5 security criteria.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/setup/initial-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Initial registration failed.");
      }

      setChallengeToken(data.challengeToken);
      setQrCodeUrl(data.qrCodeDataUrl);
      setSecretKey(data.secretBase32);
      setStep("mfa");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length < 6) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken,
          code: totpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid authenticator code. Please check your app.");
      }

      setRecoveryCodes(data.recoveryCodes || []);
      setStep("recovery");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify authenticator code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const handleFinishSetup = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0C162D] overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-blue/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        <Card className="w-full shadow-2xl border-slate-200/80 bg-white/95 backdrop-blur-md">
          {/* Header */}
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

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mx-auto">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              One-Time System Provisioning
            </div>

            <CardTitle className="text-2xl font-black text-brand-navy">
              {step === "closed"
                ? "Initial Setup Completed"
                : step === "mfa"
                ? "Mandatory MFA Enrollment"
                : step === "recovery"
                ? "Account Recovery Codes"
                : "Register First Super Admin"}
            </CardTitle>

            <CardDescription className="text-xs font-medium text-slate-500">
              {step === "closed" && "A Super Administrator account is already registered for this cluster."}
              {step === "form" && "Create your foundational administrative credentials for Mobile Tyre Champions CRM."}
              {step === "mfa" && "Scan the QR code using Google Authenticator or Microsoft Authenticator."}
              {step === "recovery" && "Store these single-use recovery codes in a secure vault before proceeding."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Loading Indicator */}
            {step === "loading" && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-navy mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Checking cluster eligibility...</p>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-800 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="font-medium">{errorMessage}</div>
              </div>
            )}

            {/* CLOSED STATE */}
            {step === "closed" && (
              <div className="py-6 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Initial Setup Has Already Been Completed
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  The initial Super Administrator account has already been registered. To access the CRM, please sign in with your credentials.
                </p>
                <div className="pt-2">
                  <Link href="/login">
                    <Button className="bg-brand-navy hover:bg-brand-navyLight font-bold text-xs text-white">
                      Return to Sign In <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 1: REGISTRATION FORM */}
            {step === "form" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <Input
                    placeholder="e.g. John Doe"
                    icon={<User className="h-4 w-4" />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Work Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="john@mobiletyrechampions.com"
                    icon={<Mail className="h-4 w-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Super Admin Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      icon={<Lock className="h-4 w-4" />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500">Strength:</span>
                        <span className="font-bold text-slate-700">{strengthLabel}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strengthColor} transition-all duration-300`}
                          style={{ width: `${(passedCriteria / 5) * 100}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                        <span className={hasMinLength ? "text-emerald-600 font-bold" : ""}>
                          {hasMinLength ? "✓" : "○"} 8+ Characters
                        </span>
                        <span className={hasUppercase ? "text-emerald-600 font-bold" : ""}>
                          {hasUppercase ? "✓" : "○"} 1 Uppercase Letter
                        </span>
                        <span className={hasLowercase ? "text-emerald-600 font-bold" : ""}>
                          {hasLowercase ? "✓" : "○"} 1 Lowercase Letter
                        </span>
                        <span className={hasNumber ? "text-emerald-600 font-bold" : ""}>
                          {hasNumber ? "✓" : "○"} 1 Number
                        </span>
                        <span className={hasSpecial ? "text-emerald-600 font-bold" : ""}>
                          {hasSpecial ? "✓" : "○"} 1 Special Symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      icon={<Lock className="h-4 w-4" />}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-brand-navy hover:bg-brand-navyLight font-bold text-sm text-white mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Super Admin...
                    </span>
                  ) : (
                    "Create Account & Proceed to MFA"
                  )}
                </Button>
              </form>
            )}

            {/* STEP 2: MANDATORY MFA SETUP */}
            {step === "mfa" && (
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <strong>Mandatory MFA:</strong> Scan the QR code using Google Authenticator, Microsoft Authenticator, or 1Password.
                </div>

                {qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <img src={qrCodeUrl} alt="Authenticator QR Code" className="w-48 h-48 rounded-lg shadow-sm" />
                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                        Manual Entry Secret Key:
                      </span>
                      <code className="text-xs font-mono font-bold text-brand-navy select-all tracking-wider">
                        {secretKey}
                      </code>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <Input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    icon={<KeyRound className="h-4 w-4" />}
                    className="text-center text-lg font-mono tracking-widest font-bold"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || totpCode.length < 6}
                  className="w-full h-11 bg-brand-orange hover:bg-orange-600 font-bold text-sm text-white"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying Code...
                    </span>
                  ) : (
                    "Verify Code & Activate Account"
                  )}
                </Button>
              </form>
            )}

            {/* STEP 3: RECOVERY CODES ACKNOWLEDGEMENT */}
            {step === "recovery" && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong>CRITICAL:</strong> Save these emergency recovery codes now. They will not be displayed again. Each code can be used once to access your account if your authenticator device is lost.
                </div>

                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 font-mono text-xs grid grid-cols-2 gap-2 text-center font-bold text-slate-800">
                  {recoveryCodes.map((code, idx) => (
                    <div key={idx} className="bg-white p-1.5 rounded border border-slate-200 shadow-xs">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyCodes}
                    className="flex-1 text-xs"
                  >
                    {copiedCodes ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <Check className="h-3.5 w-3.5" /> Copied!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Copy className="h-3.5 w-3.5" /> Copy All Codes
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleFinishSetup}
                    className="flex-1 bg-brand-navy hover:bg-brand-navyLight font-bold text-xs text-white"
                  >
                    Access CRM <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
