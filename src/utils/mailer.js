import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // MUST be false for 587
    auth: {
      user: "siliconmeditech@gmail.com",
      pass: "uwuwxzjsfhknwdie",
    },
    connectionTimeout: 100000
  });
  SMTP_USER = "siliconmeditech@gmail.com";
  return await transporter.sendMail({
    from: `"Silicon Meditech" <${SMTP_USER}>`,
    to,
    subject,
    html,
  });
};
