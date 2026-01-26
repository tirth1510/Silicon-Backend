import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { idToken, role = "user" } = req.body; // role can be 'user' or 'admin'

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
