"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck, KeyRound, Copy, Check, ArrowRight } from "lucide-react";

type AuthStep = "login" | "mfa-setup" | "mfa-verify" | "recovery-codes";

export const LoginForm: React.FC = () => {
  const [step, setStep] = useState<AuthStep>("login");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSetupAvailable, setIsSetupAvailable] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/auth/setup/initial-admin")
      .then((r) => r.json())
      .then((data) => {
        if (data.eligible) setIsSetupAvailable(true);
      })
      .catch(() => {});
  }, []);

  // MFA state
  const [challengeToken, setChallengeToken] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [totpCode, setTotpCode] = useState<string>("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onLoginSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || "Invalid email or password.");
      }

      // Check if MFA is required
      if (json.requireMfaSetup) {
        setChallengeToken(json.challengeToken);
        setQrCodeUrl(json.qrCodeDataUrl);
        setSecretKey(json.secretBase32);
        setStep("mfa-setup");
        return;
      }

      if (json.requireMfa) {
        setChallengeToken(json.challengeToken);
        setStep("mfa-verify");
        return;
      }

      // Normal login success
      window.location.href = json.redirectUrl || "/dashboard";
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim()) {
      setErrorMessage("Please enter your verification code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken,
          code: totpCode.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || "Invalid verification code.");
      }

      if (json.mfaSetupCompleted && json.recoveryCodes) {
        setRecoveryCodes(json.recoveryCodes);
        setStep("recovery-codes");
        return;
      }

      window.location.href = json.redirectUrl || "/dashboard";
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed. Please check your code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  const finishSetupAndProceed = () => {
    window.location.href = "/dashboard";
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-slate-200/80 bg-white/95 backdrop-blur-md">
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
          Mobile Tyre Champions
        </CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">
          {step === "login" && "Operations & Admin Portal Authentication"}
          {step === "mfa-setup" && "Super Admin Mandatory MFA Enrollment"}
          {step === "mfa-verify" && "Two-Factor Verification Required"}
          {step === "recovery-codes" && "Account Emergency Recovery Codes"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSetupAvailable && step === "login" && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between">
            <div>
              <span className="font-bold block">First Time Setup Open</span>
              <span className="text-[11px] text-purple-700">Register as the initial Super Administrator</span>
            </div>
            <Link
              href="/setup/initial-admin"
              className="px-2.5 py-1 bg-purple-700 text-white rounded-lg font-bold text-[11px] hover:bg-purple-800 transition-colors shrink-0"
            >
              Setup Now →
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-800 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: LOGIN */}
        {step === "login" && (
          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Work Email
              </label>
              <Input
                type="email"
                placeholder="name@mobiletyrechampions.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-orange hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••••••"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-brand-navy hover:bg-brand-navyLight font-bold text-sm tracking-wide text-white transition-all shadow-md shadow-slate-900/10 mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        )}

        {/* STEP 2: MFA SETUP (SUPER ADMIN FIRST LOGIN) */}
        {step === "mfa-setup" && (
          <form onSubmit={onVerifyMfaSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <strong>Mandatory Security:</strong> Scan this QR code using Google Authenticator, Microsoft Authenticator, or 1Password to complete setup.
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <img src={qrCodeUrl} alt="Authenticator QR Code" className="w-48 h-48 rounded-lg shadow-sm" />
                <div className="mt-2 text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                    Manual Entry Key:
                  </span>
                  <code className="text-xs font-mono font-bold text-brand-navy select-all tracking-wider">
                    {secretKey}
                  </code>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                6-Digit Authenticator Code
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
                  Activating MFA...
                </span>
              ) : (
                "Verify & Activate MFA"
              )}
            </Button>
          </form>
        )}

        {/* STEP 3: MFA VERIFY */}
        {step === "mfa-verify" && (
          <form onSubmit={onVerifyMfaSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              {isRecoveryMode ? (
                <span>Enter one of your 10-character emergency recovery codes (e.g., <code>XXXXX-XXXXX</code>).</span>
              ) : (
                <span>Enter the 6-digit code currently generated by your authenticator app.</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {isRecoveryMode ? "Emergency Recovery Code" : "6-Digit Authenticator Code"}
              </label>
              <Input
                type="text"
                placeholder={isRecoveryMode ? "XXXXX-XXXXX" : "123456"}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                icon={<KeyRound className="h-4 w-4" />}
                className="text-center text-lg font-mono tracking-widest font-bold"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !totpCode.trim()}
              className="w-full h-11 bg-brand-navy hover:bg-brand-navyLight font-bold text-sm text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(!isRecoveryMode);
                  setTotpCode("");
                  setErrorMessage("");
                }}
                className="text-xs text-brand-orange font-semibold hover:underline"
              >
                {isRecoveryMode ? "Use Authenticator App Code" : "Lost access? Use an emergency recovery code"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: RECOVERY CODES ACKNOWLEDGEMENT */}
        {step === "recovery-codes" && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <strong>CRITICAL:</strong> Save these one-time recovery codes now. They will not be shown again. Each code can be used once to access your account if you lose your authenticator app.
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
                onClick={handleCopyRecoveryCodes}
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
                onClick={finishSetupAndProceed}
                className="flex-1 bg-brand-navy hover:bg-brand-navyLight font-bold text-xs text-white"
              >
                Proceed to CRM <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
