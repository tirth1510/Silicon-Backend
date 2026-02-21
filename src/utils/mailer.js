import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // MUST be false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return await transporter.sendMail({
    from: `"Silicon Meditech" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};