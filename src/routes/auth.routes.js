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
  addProfile,
} from "#controllers/auth.controller";

import { protect, authorize } from "../middleware/auth.middleware.js";
import { updateAgentProfile } from "#controllers/agent.controller";
import { updateEstateProfile } from "#controllers/estate.controller";
import { createUpload } from "#middleware/upload.middleware";

const router = express.Router();

const uploadProfileFiles = createUpload(
  [
    { name: "profilePhoto", maxCount: 1 },
    { name: "estateLogo", maxCount: 1 },
    { name: "verificationDocuments", maxCount: 5 },
    { name: "registrationDocuments", maxCount: 5 },
  ],
  "profiles"
);

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

router.post("/add-profile", uploadProfileFiles, protect, addProfile);

router.put("/agent", protect, updateAgentProfile);

router.put("/estate", protect, updateEstateProfile);

router.patch("/role", protect, updateUserRole);

router.put("/change-password", protect, changePassword);

router.get("/admin-data", protect, authorize("admin"), (req, res) => {
  res.json({ secret: "This is admin-only data" });
});

export default router;
