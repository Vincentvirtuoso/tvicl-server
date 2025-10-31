import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  restoreProperty,
  verifyProperty,
  getTopViewedProperties,
  getPropertyStats,
  getAveragePriceByType,
  getListingsByState,
  getRecentProperties,
  getTrendingProperties,
  getRecommendedProperties,
  getTopSearches,
  getRelatedProperties,
} from "#controllers/property.controller";
import { protect } from "#middleware/auth.middleware";
import { createUpload } from "#middleware/upload.middleware";
import { Router } from "express";

const router = Router();

// Auth protected routes
router.use(protect);

// CRUD
const uploadFields = [{ name: "mediaFiles", maxCount: 20 }];

router.post(
  "/create",
  createUpload(uploadFields, "properties"),
  createProperty
);

router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.put("/:id", updateProperty);
router.delete("/:id", deleteProperty);
router.patch("/:id/restore", restoreProperty);
router.patch(
  "/:id/verify",
  //adminOnly,
  verifyProperty
);

// 📊 Analytics
router.get("/analytics/top-viewed", getTopViewedProperties);
router.get("/analytics/stats", getPropertyStats);
router.get("/analytics/average-price", getAveragePriceByType);
router.get("/analytics/by-state", getListingsByState);
router.get("/analytics/recent", getRecentProperties);
router.get("/analytics/trending", getTrendingProperties);
router.get("/analytics/recommend/:userId", getRecommendedProperties);
router.get("/analytics/top-searches", getTopSearches);
router.get("/analytics/related/:propertyId", getRelatedProperties);

export default router;
