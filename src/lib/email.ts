import nodemailer from "nodemailer";

export interface OverdueChequeItem {
  id: number;
  chequeNumber: string;
  bank: string;
  amount: number | string;
  dueDate: Date;
  customer: {
    name: string;
    phone: string;
  };
  daysOverdue: number;
}

/**
 * Creates and returns a configured nodemailer transporter for Gmail / SMTP.
 */
function getTransporter() {
  const user = process.env.SMTP_USER || "hasarangasamarakoon@gmail.com";
  // Remove any whitespace from Google app password
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  if (!pass) {
    throw new Error("SMTP_PASS is not configured in environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(num).replace("LKR", "Rs.");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Generates an aesthetic, responsive HTML email template for overdue cheque alerts.
 */
export function generateOverdueEmailHtml(
  cheques: OverdueChequeItem[],
  appUrl: string,
): string {
  const totalAmount = cheques.reduce((acc, c) => {
    const val = typeof c.amount === "string" ? parseFloat(c.amount) : Number(c.amount);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const formattedTotal = formatCurrency(totalAmount);
  const chequeCount = cheques.length;

  const chequeRows = cheques
    .map(
      (c) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 14px; font-weight: 600; color: #0f172a; font-family: monospace; font-size: 14px;">
          ${c.chequeNumber}
        </td>
        <td style="padding: 12px 14px; color: #334155;">
          <div style="font-weight: 600; color: #1e293b;">${c.customer.name}</div>
          <div style="font-size: 12px; color: #64748b;">${c.customer.phone || "No phone"}</div>
        </td>
        <td style="padding: 12px 14px; color: #475569; font-size: 13px;">
          ${c.bank}
        </td>
        <td style="padding: 12px 14px; color: #475569; font-size: 13px; white-space: nowrap;">
          ${formatDate(c.dueDate)}
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <span style="display: inline-block; background-color: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${c.daysOverdue} ${c.daysOverdue === 1 ? "day" : "days"} late
          </span>
        </td>
        <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #dc2626; font-size: 14px;">
          ${formatCurrency(c.amount)}
        </td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Overdue Cheque Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 680px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #fecaca; text-transform: uppercase;">
                      CHEQUE MANAGER SUMMARY
                    </span>
                    <h1 style="margin: 6px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 700;">
                      ⚠️ Overdue Cheques Summary: ${chequeCount} Uncleared Cheque${chequeCount > 1 ? "s" : ""}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Box -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Hello, this is your automated summary of uncleared overdue cheques from your Cheque Management System. The following cheque(s) have passed their due date and remain uncleared:
              </p>

              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                      Total Overdue Value
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: #b91c1c; margin-top: 4px;">
                      ${formattedTotal}
                    </div>
                  </td>
                  <td style="padding: 16px 20px; text-align: right;">
                    <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                      Uncleared Overdue Count
                    </div>
                    <div style="font-size: 24px; font-weight: 800; color: #b91c1c; margin-top: 4px;">
                      ${chequeCount}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cheques Table -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; text-align: left; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                      <th style="padding: 10px 14px; font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px;">Cheque #</th>
                      <th style="padding: 10px 14px; font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px;">Customer</th>
                      <th style="padding: 10px 14px; font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px;">Bank</th>
                      <th style="padding: 10px 14px; font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px;">Due Date</th>
                      <th style="padding: 10px 14px; font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; text-align: center;">Delay</th>
                      <th style="padding: 10px 14px; font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${chequeRows}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="${appUrl}/cheques" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                View Cheques in Dashboard &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">This is an automated summary notification from your Cheque Manager application.</p>
              <p style="margin: 4px 0 0 0;">A single consolidated summary email is generated whenever there are uncleared overdue cheques.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends the overdue cheque summary notification email.
 */
export async function sendOverdueNotificationEmail({
  cheques,
  recipientEmail,
  appUrl,
}: {
  cheques: OverdueChequeItem[];
  recipientEmail?: string;
  appUrl?: string;
}) {
  if (!cheques || cheques.length === 0) {
    return { success: true, message: "No overdue cheques to notify." };
  }

  const transporter = getTransporter();
  const to =
    recipientEmail ||
    process.env.NOTIFICATION_EMAIL_TO ||
    process.env.SMTP_USER ||
    "hasarangasamarakoon@gmail.com";

  const resolvedAppUrl =
    appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  const count = cheques.length;
  const subject = `⚠️ Overdue Cheques Summary: ${count} uncleared cheque${count > 1 ? "s" : ""} pending`;
  const html = generateOverdueEmailHtml(cheques, resolvedAppUrl);

  const info = await transporter.sendMail({
    from: `"Cheque Manager" <${process.env.SMTP_USER || "hasarangasamarakoon@gmail.com"}>`,
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId, recipient: to };
}
