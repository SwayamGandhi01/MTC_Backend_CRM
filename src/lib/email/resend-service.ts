import { Resend } from "resend";
import { connectToDatabase } from "@/lib/db/mongodb";
import { EmailLog, IEmailLog } from "@/models/EmailLog";
import { publishRealtimeDashboardEvent } from "@/lib/events/business-events";
import {
  renderAppointmentConfirmationEmail,
  renderAppointmentStatusChangeEmail,
  renderAdminAlertEmail,
} from "./templates";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  templateName: string;
  category?: "customer" | "admin" | "auth" | "system";
  referenceId?: string;
  relatedEntityType?: "appointment" | "enquiry" | "callback" | "user" | "customer";
  relatedEntityId?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Authoritative Centralized Email Service for Mobile Tyre Champions CRM
 */
class ResendEmailService {
  private resend: Resend | null = null;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.defaultFrom = process.env.EMAIL_FROM?.trim() || "Mobile Tyre Champions <info@mobiletyrechampions.com>";
  }

  /**
   * Dispatches transactional email, records to EmailLog outbox, and returns message ID.
   */
  async sendTransactionalEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    await connectToDatabase();

    const fromAddress = this.defaultFrom;
    const apiKey = process.env.RESEND_API_KEY?.trim();

    // 1. If Resend is live & configured
    if (apiKey) {
      if (!this.resend) {
        this.resend = new Resend(apiKey);
      }

      try {
        const { data, error } = await this.resend.emails.send({
          from: fromAddress,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        });

        if (error || !data) {
          throw new Error(error?.message || "Failed to dispatch email via Resend");
        }

        const resendMessageId = data.id;

        const logRecord = await EmailLog.create({
          recipient: params.to,
          subject: params.subject,
          templateName: params.templateName,
          status: "Sent",
          category: params.category || "customer",
          referenceId: params.referenceId,
          resendMessageId,
          relatedEntityType: params.relatedEntityType,
          relatedEntityId: params.relatedEntityId,
          sender: fromAddress,
          sentAt: new Date(),
          deliveryTimeline: [
            {
              event: "email.sent",
              timestamp: new Date(),
              data: { resendMessageId },
            },
          ],
        });

        // Broadcast real-time email dispatched event
        try {
          await publishRealtimeDashboardEvent({
            eventId: `evt_email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            eventType: "email.sent",
            entityType: "email",
            entityId: logRecord._id.toString(),
            payload: {
              resendMessageId,
              status: "Sent",
              recipient: params.to,
              subject: params.subject,
              templateName: params.templateName,
              referenceId: params.referenceId,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {}

        return { success: true, messageId: resendMessageId };
      } catch (err: any) {
        console.error(`[Resend Email Error] To: ${params.to} | Subject: ${params.subject}:`, err?.message || err);

        const failRecord = await EmailLog.create({
          recipient: params.to,
          subject: params.subject,
          templateName: params.templateName,
          status: "Failed",
          category: params.category || "customer",
          referenceId: params.referenceId,
          relatedEntityType: params.relatedEntityType,
          relatedEntityId: params.relatedEntityId,
          sender: fromAddress,
          errorMessage: err?.message || String(err),
          sentAt: new Date(),
          deliveryTimeline: [
            {
              event: "email.failed",
              timestamp: new Date(),
              data: { error: err?.message },
            },
          ],
        });

        try {
          await publishRealtimeDashboardEvent({
            eventId: `evt_email_failed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            eventType: "email.failed",
            entityType: "email",
            entityId: failRecord._id.toString(),
            payload: {
              status: "Failed",
              recipient: params.to,
              subject: params.subject,
              templateName: params.templateName,
              referenceId: params.referenceId,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {}

        return { success: false, error: err?.message || String(err) };
      }
    }

    // 2. Simulated / Development mode (Key not set)
    console.log(`[Email Simulation] To: ${params.to} | Template: ${params.templateName} | Subject: ${params.subject}`);
    const simulatedId = `msg_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const simRecord = await EmailLog.create({
      recipient: params.to,
      subject: params.subject,
      templateName: params.templateName,
      status: "Sent",
      category: params.category || "customer",
      referenceId: params.referenceId,
      resendMessageId: simulatedId,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      sender: fromAddress,
      metadata: { simulated: true },
      sentAt: new Date(),
      deliveryTimeline: [
        {
          event: "email.sent",
          timestamp: new Date(),
          data: { simulated: true },
        },
      ],
    });

    try {
      await publishRealtimeDashboardEvent({
        eventId: `evt_email_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: "email.sent",
        entityType: "email",
        entityId: simRecord._id.toString(),
        payload: {
          resendMessageId: simulatedId,
          status: "Sent",
          recipient: params.to,
          subject: params.subject,
          templateName: params.templateName,
          referenceId: params.referenceId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {}

    return { success: true, messageId: simulatedId, simulated: true };
  }

  /**
   * Helper: Dispatches appointment confirmation to customer
   */
  async sendAppointmentConfirmation(data: {
    to: string;
    customerName: string;
    referenceId: string;
    serviceType: string;
    vehicleReg?: string;
    postcode: string;
    timingSlot: string;
    appointmentId?: string;
  }) {
    const html = renderAppointmentConfirmationEmail(data);
    return this.sendTransactionalEmail({
      to: data.to,
      subject: `Appointment Confirmed: ${data.referenceId} - Mobile Tyre Champions`,
      html,
      templateName: "appointment-confirmation",
      category: "customer",
      referenceId: data.referenceId,
      relatedEntityType: "appointment",
      relatedEntityId: data.appointmentId,
    });
  }

  /**
   * Helper: Dispatches appointment status update to customer
   */
  async sendAppointmentStatusUpdate(data: {
    to: string;
    customerName: string;
    referenceId: string;
    status: string;
    notes?: string;
    appointmentId?: string;
  }) {
    const html = renderAppointmentStatusChangeEmail(data);
    return this.sendTransactionalEmail({
      to: data.to,
      subject: `Update on your Booking: ${data.referenceId} (${data.status.toUpperCase()})`,
      html,
      templateName: "appointment-status-change",
      category: "customer",
      referenceId: data.referenceId,
      relatedEntityType: "appointment",
      relatedEntityId: data.appointmentId,
    });
  }

  /**
   * Helper: Dispatches internal admin alert for high-priority bookings or roadside emergencies
   */
  async sendAdminAlert(data: {
    headline: string;
    category: string;
    referenceId: string;
    customerName: string;
    phoneNumber: string;
    postcode: string;
    details: string;
    entityType: "appointment" | "enquiry" | "callback";
    entityId: string;
  }) {
    const adminTo = process.env.EMAIL_ADMIN_TO?.trim() || "admin@mobiletyrechampions.com";
    const html = renderAdminAlertEmail(data);

    return this.sendTransactionalEmail({
      to: adminTo,
      subject: `[MTC Alert] ${data.headline} (${data.referenceId})`,
      html,
      templateName: "admin-alert",
      category: "admin",
      referenceId: data.referenceId,
      relatedEntityType: data.entityType,
      relatedEntityId: data.entityId,
    });
  }
}

export const emailService = new ResendEmailService();
export const resendEmailService = emailService;
export default emailService;
