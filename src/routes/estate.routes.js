import express from "express";
import { protect, restrictToActiveRole } from "#middleware/auth.middleware";
import { getEstateProfile } from "#controllers/estate.controller";

const router = express.Router();

router.use(protect);
router.use(restrictToActiveRole("estate"));

router.get("/profile", getEstateProfile);

export default router;
