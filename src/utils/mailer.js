import nodemailer from "nodemailer";

/**
 * Production email: Use Resend when RESEND_API_KEY is set (recommended for Render).
 * Gmail SMTP often fails on cloud platforms due to IP blocking.
 */
async function sendViaResend({ to, subject, html, fromEmail, fromName }) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM || (fromName && fromEmail ? `${fromName} <${fromEmail}>` : null) || "Silicon Meditech <onboarding@resend.dev>";
  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fallback: Gmail SMTP (works locally; may fail on Render due to cloud IP blocking)
 */
async function sendViaSmtp({ to, subject, html, fromEmail }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS required when not using Resend.");
  }
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    family: 4,
    requireTLS: port === 587,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  return transporter.sendMail({
    from: `"Silicon Meditech" <${fromEmail || user}>`,
    to,
    subject,
    html,
  });
}

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const useResend = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.SMTP_USER || process.env.RESEND_FROM_EMAIL;

    if (useResend) {
      await sendViaResend({
        to,
        subject,
        html,
        fromEmail: process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER,
        fromName: "Silicon Meditech",
      });
    } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendViaSmtp({ to, subject, html, fromEmail });
    } else {
      console.error("[Mailer] No email config. Set RESEND_API_KEY (recommended) or SMTP_USER+SMTP_PASS in Render.");
      throw new Error("Email not configured. Add RESEND_API_KEY or SMTP_USER/SMTP_PASS in Render environment.");
    }
  } catch (error) {
    console.error("[Mailer] Send failed:", error?.message || error);
    throw error;
  }
};
