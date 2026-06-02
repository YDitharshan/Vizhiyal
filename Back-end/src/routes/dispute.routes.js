// routes/dispute.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  createDispute,
  getMyDisputes,
  getAllDisputes,
  getDisputeById,
  updateDisputeStatus,
} from "../controllers/dispute.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const disputeRules = [
  body("bookingId").notEmpty().withMessage("Booking ID is required"),
  body("type")
    .isIn(["no_show", "poor_quality", "wrong_service", "payment_issue", "other"])
    .withMessage("Invalid dispute type"),
  body("description")
    .trim()
    .notEmpty().withMessage("Description is required")
    .isLength({ min: 20 }).withMessage("Please describe the issue in at least 20 characters"),
];

// All dispute routes require login
router.use(protect);

router.post("/",            authorize("buyer"),                          disputeRules,  createDispute);
router.get ("/my",          authorize("buyer", "seller"),                               getMyDisputes);
router.get ("/all",         authorize("admin", "superadmin"),                           getAllDisputes);
router.get ("/:id",         authorize("buyer", "seller", "admin", "superadmin"),        getDisputeById);
router.patch("/:id/status", authorize("admin", "superadmin"),                           updateDisputeStatus);

export default router;
