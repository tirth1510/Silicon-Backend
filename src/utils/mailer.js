import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // ALWAYS TRUE for Gmail + 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return info;
  } catch (error) {
    console.error("Email Error:", error);
    throw error;
  }
};
