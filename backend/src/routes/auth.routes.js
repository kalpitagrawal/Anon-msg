import { Router } from "express";
import { signup, verifyOtp, login, refreshAccessToken, logout, resendOtp, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { authLimiter, otpLimiter, otpVerifyLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/signup", authLimiter, signup);
router.post("/verify-otp", otpVerifyLimiter, verifyOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", verifyJWT, logout);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", otpVerifyLimiter, resetPassword);

export default router;
