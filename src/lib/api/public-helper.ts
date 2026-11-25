import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Accept, X-Idempotency-Key, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function handleOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function publicSuccess(data: any, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    {
      status,
      headers: corsHeaders,
    }
  );
}

export function publicError(
  message: string,
  status = 400,
  fieldErrors?: Record<string, string>
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
    {
      status,
      headers: corsHeaders,
    }
  );
}

// In-memory rate limiter for public form submissions
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 public submissions per IP per 10 mins

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  return true;
}
