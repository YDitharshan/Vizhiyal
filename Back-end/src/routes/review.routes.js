// routes/review.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  createReview,
  getVendorReviews,
  getGigReviews,
  flagReview,
  removeReview,
  getAllReviews,
} from "../controllers/review.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const reviewRules = [
  body("bookingId").notEmpty().withMessage("Booking ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isLength({ max: 1000 }),
];

// ── Public ────────────────────────────────────────────────────
router.get("/vendor/:vendorId", getVendorReviews);
router.get("/gig/:gigId",       getGigReviews);

// ── Buyer only ────────────────────────────────────────────────
router.post("/", protect, authorize("buyer"), reviewRules, createReview);

// ── Admin only ────────────────────────────────────────────────
router.get   ("/all",            protect, authorize("admin", "superadmin"), getAllReviews);
router.patch ("/:id/flag",       protect, authorize("admin", "superadmin"), flagReview);
router.patch ("/:id/remove",     protect, authorize("admin", "superadmin"), removeReview);

export default router;
