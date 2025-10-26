import express from "express";
import {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  changePassword,
  updateUserRole,
} from "../controllers/auth.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.get("/verify-email/:token", verifyEmail);

router.post("/resend-verification", resendVerificationEmail);

router.post("/login", login);

router.post("/logout", logout);

router.post("/refresh-token", refreshToken);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.get("/me", protect, getCurrentUser);

router.put("/profile", protect, updateProfile);

router.patch("/role", protect, updateUserRole);

router.put("/change-password", protect, changePassword);

router.get("/admin-data", protect, authorize("admin"), (req, res) => {
  res.json({ secret: "This is admin-only data" });
});

export default router;
