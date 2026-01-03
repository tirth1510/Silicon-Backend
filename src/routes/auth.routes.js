import express from "express";
import { register, login ,getProfile,logout, resetPassword} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", isAuthenticated, getProfile);
router.post("/logout", isAuthenticated, logout);
router.post("/reset-password", resetPassword);


export default router;
