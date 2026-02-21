import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { sendEmail } from "../utils/mailer.js"; // Added import for your mailer

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const COMPANY_LOGO_URL = "https://res.cloudinary.com/dq4hevka1/image/upload/v1766235630/products/product-images/gbhs2ft4m5fqvwue0kol.png";

export const googleLogin = async (req, res) => {
  try {
    const { idToken, role = "admin" } = req.body; // role can be 'user' or 'admin'

    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // 🔐 Verify Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { sub, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ message: "Email not verified by Google" });
    }

    // 🔍 Check if email exists in both collections
    let user = await User.findOne({ email });
    let admin = await Admin.findOne({ email });

    let account; // The account that will be used for login

    if (user) {
      account = user;
    } else if (admin) {
      account = admin;
    } else {
      // Email not found in any model → create new
      if (role === "user") {
        account = await User.create({
          googleId: sub,
          username: name,
          email,
          password: "GOOGLE_AUTH",
          imageUrl: picture,
          role: "user",
          isVerified: "true",
        });
      } else if (role === "admin") {
        account = await Admin.create({
          googleId: sub,
          username: name,
          email,
          password: "GOOGLE_AUTH",
          imageUrl: picture,
          role: "admin",
          isVerified: "true",
        });
      } else {
        return res.status(400).json({ message: "Invalid role" });
      }

      // ✉️ SEND WELCOME EMAIL (Only runs for new signups)
      const emailHeader = `<div style="text-align: center; margin-bottom: 10px;"><img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto;"/></div>`;
      
      await sendEmail({
        to: email,
        subject: "Welcome to Silicon Meditech Pvt. Ltd",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              
              <div style="background-color: #ffffff; color: #0f172a; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                ${emailHeader}
              </div>

              <div style="padding: 30px; color: #334155; line-height: 1.6;">
                <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Wellcome ${name},</h2>
                <p style="font-size: 16px;">Thank you for signing up to our website. We are thrilled to have you with us!</p>
                <p style="font-size: 16px;">You can now explore our medical equipment, manage your inquiries, and easily track your activity.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://www.siliconmeditech.in" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Visit Our Website</a>
                </div>

                <p style="margin-bottom: 0; font-size: 15px; margin-top: 30px;">Best regards,<br/><strong style="color: #0f172a;">Silicon Meditech Team</strong></p>
              </div>

              <div style="background-color: #f8fafc; color: #94a3b8; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0;">Visit us at <a href="https://www.siliconmeditech.in" style="color: #3b82f6; text-decoration: none; font-weight: 500;">www.siliconmeditech.in</a></p>
              </div>
              
            </div>
          </body>
          </html>
        `
      }).catch(err => console.error("Google welcome email failed:", err));
    }

    // 🔑 Create JWT token
    const tokenExpirySeconds = 60 * 60; // 1 hour
    const accessToken = jwt.sign(
      { id: account._id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpirySeconds }
    );

    // 💾 Save token in DB
    account.accessToken = accessToken;
    account.tokenExpiresAt = new Date(Date.now() + tokenExpirySeconds * 1000);
    await account.save();

    // 🍪 Set cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: tokenExpirySeconds * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        id: account._id,
        username: account.username,
        email: account.email,
        role: account.role,
        imageUrl: account.imageUrl,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};