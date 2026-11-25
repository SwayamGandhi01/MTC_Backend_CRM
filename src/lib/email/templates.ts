/**
 * Official MTC Branded Transactional Email Templates
 * 
 * Brand Colors:
 * - Navy: #0C162D
 * - Blue: #00468B
 * - Orange: #E67E22
 * - Light Background: #F8FAFC
 * Logo URL: https://www.mobiletyrechampions.com/images/MTC%20logo%202.webp
 */

const LOGO_URL = "https://www.mobiletyrechampions.com/images/MTC%20logo%202.webp";

function baseEmailWrapper(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    table { border-collapse: collapse; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background-color: #0C162D; padding: 28px 32px; text-align: center; }
    .header img { height: 48px; width: auto; }
    .body { padding: 36px 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #fef3c7; color: #b45309; }
    .title { font-size: 22px; font-weight: 800; color: #0C162D; margin: 16px 0 8px 0; }
    .subtitle { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0; }
    .detail-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
    .cta-btn { display: inline-block; background-color: #E67E22; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; margin: 12px 0 20px 0; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; font-size: 12px; color: #94a3b8; text-align: center; }
    .footer a { color: #E67E22; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="Mobile Tyre Champions" />
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #64748b;">Mobile Tyre Champions • 24/7 Mobile Tyre Fitting</p>
      <p style="margin: 0 0 8px 0;">Surrey • Hampshire • Berkshire • London & M25</p>
      <p style="margin: 0;">Need immediate roadside assistance? Call <a href="tel:02071013856">0207 101 3856</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function renderAppointmentConfirmationEmail(data: {
  customerName: string;
  referenceId: string;
  serviceType: string;
  vehicleReg?: string;
  postcode: string;
  timingSlot: string;
}): string {
  const content = `
    <span class="badge">Booking Confirmed</span>
    <h1 class="title">Your Mobile Tyre Appointment Is Confirmed</h1>
    <p class="subtitle">Hello ${data.customerName}, your mobile tyre fitting request has been scheduled with our mobile workshop fleet.</p>
    
    <div class="detail-card">
      <table width="100%">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Booking Reference</td>
          <td style="padding: 6px 0; color: #0C162D; font-weight: 800; font-size: 14px; text-align: right; font-family: monospace;">${data.referenceId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Service Required</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 13px; text-align: right;">${data.serviceType}</td>
        </tr>
        ${data.vehicleReg ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Vehicle Registration</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 13px; text-align: right;">${data.vehicleReg}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Fitting Location</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 13px; text-align: right;">${data.postcode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Arrival Window</td>
          <td style="padding: 6px 0; color: #E67E22; font-weight: 700; font-size: 13px; text-align: right;">${data.timingSlot}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      Our certified technician will arrive equipped with state-of-the-art mobile balancing and fitting machinery. You will receive an SMS alert when the technician is en route.
    </p>
  `;
  return baseEmailWrapper("Appointment Confirmed - Mobile Tyre Champions", content);
}

export function renderAppointmentStatusChangeEmail(data: {
  customerName: string;
  referenceId: string;
  status: string;
  notes?: string;
}): string {
  const content = `
    <span class="badge" style="background-color: #dbeafe; color: #1d4ed8;">Status Update</span>
    <h1 class="title">Booking Status Update: ${data.status.toUpperCase()}</h1>
    <p class="subtitle">Hello ${data.customerName}, the status of your mobile tyre appointment (${data.referenceId}) has changed to <strong>${data.status}</strong>.</p>
    
    ${data.notes ? `
    <div class="detail-card">
      <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Operations Note:</strong> ${data.notes}</p>
    </div>` : ''}

    <p style="font-size: 13px; color: #475569; line-height: 1.6;">
      If you have questions regarding your appointment or need to adjust your time slot, please call our 24/7 dispatch office directly on <a href="tel:02071013856" style="color: #E67E22; font-weight: bold;">0207 101 3856</a>.
    </p>
  `;
  return baseEmailWrapper(`Booking Status Update: ${data.status}`, content);
}

export function renderAdminAlertEmail(data: {
  headline: string;
  category: string;
  referenceId: string;
  customerName: string;
  phoneNumber: string;
  postcode: string;
  details: string;
}): string {
  const isEmergency = /emergency/i.test(data.category) || /emergency/i.test(data.headline);
  const badgeStyle = isEmergency
    ? "background-color: #fee2e2; color: #b91c1c;"
    : "background-color: #e0f2fe; color: #0369a1;";

  const content = `
    <span class="badge" style="${badgeStyle}">${isEmergency ? "🚨 EMERGENCY ALERT" : "OPERATIONS ALERT"}</span>
    <h1 class="title">${data.headline}</h1>
    <p class="subtitle">A new customer submission has been received and stored in MongoDB Atlas.</p>
    
    <div class="detail-card">
      <table width="100%">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Reference ID</td>
          <td style="padding: 6px 0; color: #0C162D; font-weight: 800; font-size: 14px; text-align: right; font-family: monospace;">${data.referenceId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Customer Name</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 13px; text-align: right;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Customer Phone</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 13px; text-align: right;"><a href="tel:${data.phoneNumber}">${data.phoneNumber}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Postcode</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-size: 13px; text-align: right;">${data.postcode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Details</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: 500; font-size: 13px; text-align: right;">${data.details}</td>
        </tr>
      </table>
    </div>

    <center>
      <a href="https://mobiletyrechampions.com/dashboard" class="cta-btn">Open CRM Operations Command</a>
    </center>
  `;
  return baseEmailWrapper(`[CRM Alert] ${data.headline}`, content);
}
