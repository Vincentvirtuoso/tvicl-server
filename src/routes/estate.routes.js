import express from "express";
import { protect } from "#middleware/auth.middleware";
import { getEstateProfile } from "#controllers/estate.controller";

const router = express.Router();

router.use(protect);

router.get("/profile", getEstateProfile);

export default router;
