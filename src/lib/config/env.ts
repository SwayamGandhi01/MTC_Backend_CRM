/**
 * Centralized Server-Side Environment Configuration.
 * 
 * STRICT ARCHITECTURAL & SECURITY RULE:
 * This CRM is completely independent of Strapi and legacy systems.
 * It uses MongoDB Atlas for its persistence layer.
 * Secrets MUST NEVER be exposed to client-side code ('use client').
 */

export interface ServerEnvConfig {
  NODE_ENV: string;
  MONGODB_URI?: string;
  MONGODB_DB_NAME: string;
  SESSION_SECRET: string;
  APP_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM: string;
  ADMIN_EMAIL: string;
  IS_PRODUCTION: boolean;
}

export function getServerEnv(): ServerEnvConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";

  const sessionSecret =
    process.env.SESSION_SECRET?.trim() ||
    "dev-mtc-crm-secret-do-not-use-in-production-must-be-at-least-32-chars";

  if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
    console.warn(
      "[Security Warning] SESSION_SECRET is not securely set for production. Must be at least 32 characters!"
    );
  }

  return {
    NODE_ENV: nodeEnv,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "mtc_crm",
    SESSION_SECRET: sessionSecret,
    APP_URL: process.env.APP_URL || "http://localhost:3000",
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || "dispatch@mobiletyrechampions.com",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@mobiletyrechampions.com",
    IS_PRODUCTION: isProd,
  };
}
