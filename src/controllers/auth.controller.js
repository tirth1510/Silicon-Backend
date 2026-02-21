import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { sendEmail } from "../utils/mailer.js";
import bcrypt from "bcrypt";
import {validateEmailGlobally} from "../utils/validateEmail.js"
export const register = async (req, res) => {
  try {
    const { username, email, password, role, imageUrl } = req.body;

    // 1. Validate Email Format/Domain
    const emailCheck = await validateEmailGlobally(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.reason });
    }

    // 2. Cross-check BOTH collections for global uniqueness
    const [existingUser, existingAdmin] = await Promise.all([
      User.findOne({ $or: [{ email }, { username }] }),
      Admin.findOne({ $or: [{ email }, { username }] })
    ]);

    if (existingUser || existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: "Username or Email already in use across the platform" 
      });
    }

    // 3. Initialize Document
    const Model = role === "admin" ? Admin : User;
    const createdUser = new Model({ username, email, password, role, imageUrl });

    // 4. Generate Token (Do this before first save to avoid double writing if possible)
    const tokenExpirySeconds = 3600; 
    const accessToken = jwt.sign(
      { id: createdUser._id, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    createdUser.accessToken = accessToken;
    createdUser.tokenExpiresAt = new Date(Date.now() + tokenExpirySeconds * 1000);

    await createdUser.save();

    // 5. Fire-and-forget Email (Don't let email failure crash the response)
    await sendEmail({
      to: email,
      subject: "Welcome!",
      html: `<h2>Hello ${username},</h2><p>Account created as ${role}.</p>`,
    }).catch(err => console.error("Email failed to send:", err));

    // 6. Set Cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: tokenExpirySeconds * 1000,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: createdUser._id,
        username,
        email,
        role,
        imageUrl,
        tokenExpiresAt: createdUser.tokenExpiresAt
      }
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, error: "Registration failed." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Search both in parallel for speed
    const [userDoc, adminDoc] = await Promise.all([
      User.findOne({ email }),
      Admin.findOne({ email })
    ]);

    const user = userDoc || adminDoc;

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Reduced to 7 days for better security posture
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } 
    );

    // Update user record
    user.accessToken = accessToken;
    user.tokenExpiresAt = new Date(Date.now() + sevenDaysInSeconds * 1000);
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "strict", 
      maxAge: sevenDaysInSeconds * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      id: user._id,
      googleId: user.googleId || "", 
      username: user.username,
      email: user.email,
      role: user.role,
      imageUrl: user.imageUrl,
      isVerified: user.isVerified
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      // If there's no token, they are effectively logged out anyway
      return res.status(200).json({ success: true, message: "Already logged out" });
    }

    try {
      // We use decode instead of verify here because we want to allow logout 
      // even if the token is technically expired.
      const decoded = jwt.decode(token);

      if (decoded && decoded.id) {
        const Model = decoded.role === "admin" ? Admin : User;
        
        // Find and clear token fields in one step
        await Model.findByIdAndUpdate(decoded.id, {
          $unset: { accessToken: 1, tokenExpiresAt: 1 } // Completely removes the fields
        });
      }
    } catch (jwtError) {
      console.error("JWT Decode Error during logout:", jwtError);
      // We continue anyway to clear the cookie
    }

    // Clear the cookie with matching attributes
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none", // Must be a string
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "Server error during logout" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Password fields are required" });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    let user =
      (await User.findOne({ email })) || (await Admin.findOne({ email }));
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Assign plain password (pre-save hook will hash it)
    user.password = password;
    user.accessToken = null;
    user.tokenExpiresAt = null;
    await user.save();

    await sendEmail({
      to: email,
      subject: "Password Reset Successful",
      html: `<h2>Hello ${user.username},</h2>
             <p>Your password has been updated successfully.</p>`,
    }).catch(err => console.error("Reset password email failed:", err));

    return res.status(200).json({
      success: true,
      message: "Password reset successfully, please login with new password",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
