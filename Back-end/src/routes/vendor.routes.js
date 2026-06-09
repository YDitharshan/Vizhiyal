// routes/vendor.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  createProfile,
  getMyProfile,
  updateProfile,
  listVendors,
  getVendorById,
  getVerifiedWork,
  getWorksWith,
} from "../controllers/vendor.controller.js";
import {
  getAvailability,
  getMyAvailability,
  blockDate,
  unblockDate,
} from "../controllers/availability.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const profileRules = [
  body("businessName").trim().notEmpty().withMessage("Business name is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("description").optional().isLength({ max: 1000 }),
  body("portfolio").optional().isArray(),
];

// ── Seller only (must be before /:id/* wildcards) ────────────
router.get   ("/me/profile",      protect, authorize("seller"), getMyProfile);
router.get   ("/me/availability", protect, authorize("seller"), getMyAvailability);
router.post  ("/profile",         protect, authorize("seller"), profileRules, createProfile);
router.put   ("/profile",         protect, authorize("seller"), profileRules, updateProfile);
router.post  ("/availability",    protect, authorize("seller"), blockDate);
router.delete("/availability",    protect, authorize("seller"), unblockDate);

// ── Public ────────────────────────────────────────────────────
router.get("/",                   listVendors);
router.get("/:id/availability",   getAvailability);
router.get("/:id/verified-work",  getVerifiedWork);
router.get("/:id/works-with",     getWorksWith);
router.get("/:id",                getVendorById);

export default router;
