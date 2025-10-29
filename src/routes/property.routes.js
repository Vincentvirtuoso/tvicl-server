// routes/propertyRoutes.js
import express from "express";
import { protect } from "#middleware/auth.middleware";
import { createProperty } from "#controllers/property.controller";

const router = express.Router();

router.use(protect);

router.post("/create", createProperty);

export default router;
