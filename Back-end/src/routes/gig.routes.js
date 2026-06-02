// routes/gig.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  listGigs,
  getGigById,
  getMyGigs,
  createGig,
  updateGig,
  deleteGig,
} from "../controllers/gig.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const gigRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("basicPrice").isFloat({ min: 0 }).withMessage("Basic price must be a positive number"),
  body("standardPrice").isFloat({ min: 0 }).withMessage("Standard price must be a positive number"),
  body("premiumPrice").isFloat({ min: 0 }).withMessage("Premium price must be a positive number"),
  body("images").optional().isArray(),
];

// ── Public (list only — no param) ─────────────────────────────
router.get("/", listGigs);

// ── Seller only (before /:id so nothing is shadowed) ─────────
router.get   ("/my/gigs", protect, authorize("seller"),           getMyGigs);
router.post  ("/",        protect, authorize("seller"), gigRules, createGig);
router.put   ("/:id",     protect, authorize("seller"),           updateGig);
router.delete("/:id",     protect, authorize("seller"),           deleteGig);

// ── Public single-gig (parameterised — must be last) ─────────
router.get("/:id", getGigById);

export default router;
