// routes/booking.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  createBooking,
  getMyBookings,
  getSellerBookings,
  getBookingById,
  updateBookingStatus,
  submitCompletion,
  confirmCompletion,
  getBookedDates,
  getVendorQueueCount,
} from "../controllers/booking.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const bookingRules = [
  body("gigId").notEmpty().withMessage("Gig ID is required"),
  body("packageType")
    .isIn(["basic", "standard", "premium"])
    .withMessage("Package type must be basic, standard, or premium"),
  body("eventDate")
    .notEmpty().withMessage("Event date is required")
    .isISO8601().withMessage("Event date must be a valid date"),
];

// ── Public routes (no login needed) ─────────────────────────────────
router.get("/vendor/:vendorId/booked-dates",  getBookedDates);
router.get("/vendor/:vendorId/queue-count",   getVendorQueueCount);

// ── All routes below require login ───────────────────────────
router.use(protect);

router.post  ("/",               authorize("buyer"),            bookingRules,  createBooking);
router.get   ("/my",                                                           getMyBookings); // any authenticated user — query is scoped by userId
router.get   ("/seller",         authorize("seller"),                          getSellerBookings);
router.get   ("/:id",                    authorize("buyer","seller","admin","superadmin"), getBookingById);
router.patch ("/:id/status",            authorize("seller","admin","superadmin"),          updateBookingStatus);
router.post  ("/:id/submit-completion", authorize("seller"),                               submitCompletion);
router.post  ("/:id/confirm-completion",authorize("buyer","admin","superadmin"),           confirmCompletion);

export default router;
