import { EmailLog } from "@/models/EmailLog";
import { connectToDatabase } from "@/lib/db/mongodb";

/**
 * Transactional Email Dispatcher for Authentication
 * 
 * Uses Resend API when RESEND_API_KEY is configured.
 * Safely falls back to internal logging when offline/unconfigured.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateName: string;
  referenceId?: string;
}

export async function sendAuthEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.AUTH_EMAIL_FROM || process.env.EMAIL_FROM || "auth@mobiletyrechampions.com";

  await connectToDatabase();

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: `Mobile Tyre Champions <${fromEmail}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Resend API call failed");
      }

      await EmailLog.create({
        recipient: options.to,
        subject: options.subject,
        templateName: options.templateName,
        status: "Sent",
        referenceId: options.referenceId,
      });

      return { success: true };
    } catch (err: any) {
      console.error("[Email Dispatch Error]", err.message);

      await EmailLog.create({
        recipient: options.to,
        subject: options.subject,
        templateName: options.templateName,
        status: "Failed",
        errorMessage: err.message,
        referenceId: options.referenceId,
      });

      return { success: false, error: err.message };
    }
  } else {
    // Development / unconfigured mode: record log cleanly
    console.log(`[Email Dispatch Simulation] To: ${options.to} | Subject: ${options.subject}`);

    await EmailLog.create({
      recipient: options.to,
      subject: options.subject,
      templateName: options.templateName,
      status: "Sent",
      metadata: { simulated: true },
      referenceId: options.referenceId,
    });

    return { success: true };
  }
}
