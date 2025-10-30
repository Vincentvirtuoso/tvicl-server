import express from "express";
import { getAgent } from "#controllers/agent.controller";
import { protect, restrictToActiveRole } from "#middleware/auth.middleware";

const router = express.Router();

router.use(protect);
router.use(restrictToActiveRole("agent"));

router.get("/", getAgent);

export default router;
