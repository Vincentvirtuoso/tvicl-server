import express from "express";
import { getAgent } from "#controllers/agent.controller";

const router = express.Router();

router.get("/:id", getAgent);

export default router;
