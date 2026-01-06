import express from "express";
import {
  register,
  login,
  getProfile,
  logout,
  resetPassword,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { googleLogin } from "../controllers/google.controller.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", isAuthenticated, getProfile);
router.post("/logout", isAuthenticated, logout);
router.post("/reset-password", resetPassword);
// routes/auth.routes.js
router.post("/google-login", googleLogin);


export default router;
