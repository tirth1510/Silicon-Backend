import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { sendEmail } from "../utils/mailer.js";
import bcrypt from "bcrypt";
import {validateEmailGlobally} from "../utils/validateEmail.js"
export const register = async (req, res) => {
  try {
    const { username, email, password, role, imageUrl } = req.body;

    const emailCheck = await validateEmailGlobally(email);
    if (!emailCheck.valid) {
      return res.status(400).json({
        success: false,
        message: emailCheck.reason,
      });
    }

    const userExists =
      (role === "admin" && (await Admin.findOne({ username }))) ||
      (role === "user" && (await User.findOne({ username })));

    const emailExists =
      (role === "admin" && (await Admin.findOne({ email }))) ||
      (role === "user" && (await User.findOne({ email })));

    if (userExists)
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });
    if (emailExists)
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });

    let createdUser;
    if (role === "admin") {
      createdUser = new Admin({ username, email, password, role, imageUrl });
    } else {
      createdUser = new User({ username, email, password, role, imageUrl });
    }

    await createdUser.save();

    // Send Email
    await sendEmail({
      to: email,
      subject: "Registration Successful",
      html: `<h2>Hello ${username},</h2>
             <p>Your account has been created successfully as a <strong>${role}</strong>.</p>`,
    });

    // Generate JWT token
    const tokenExpirySeconds = 3600; // 1 hour
    const accessToken = jwt.sign(
      { id: createdUser._id, role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpirySeconds }
    );

    createdUser.accessToken = accessToken; // store only one token
    createdUser.tokenExpiresAt = new Date(
      Date.now() + tokenExpirySeconds * 1000
    );
    await createdUser.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: tokenExpirySeconds * 1000,
    });

    return res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      emailMessage: "Email sent successfully",
      id: createdUser._id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
      imageUrl: createdUser.imageUrl,
      accessToken,
      tokenExpiresAt: createdUser.tokenExpiresAt,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user =
      (await User.findOne({ email })) || (await Admin.findOne({ email }));
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const tokenExpirySeconds = 100 * 365 * 24 * 60 * 60;
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpirySeconds }
    );

    user.accessToken = accessToken;
    user.tokenExpiresAt = new Date(Date.now());
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: tokenExpirySeconds,
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
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
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "No token found" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user =
      decoded.role === "admin"
        ? await Admin.findById(decoded.id)
        : await User.findById(decoded.id);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.accessToken = null; // remove token
    user.tokenExpiresAt = null;
    await user.save();

    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, error: error.message });
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
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully, please login with new password",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
