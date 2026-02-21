import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    // Default to 465 (SSL) for Gmail as it is more reliable on cloud servers than 587
    const defaultPort = host.includes("gmail") ? 465 : 587;
    const port = Number(process.env.SMTP_PORT) || defaultPort;

    const transporter = nodemailer.createTransport({
      host,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      family: 4,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 30000, // Increased to 30 seconds
      greetingTimeout: 30000,   // Increased to 30 seconds
      socketTimeout: 30000,     // Added socket timeout
    });

    const info = await transporter.sendMail({
      from: `"Silicon Meditech" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};
