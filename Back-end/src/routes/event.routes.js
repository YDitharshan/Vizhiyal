// routes/event.routes.js — Smart Event Bundle Builder
import { Router } from "express";
import { body } from "express-validator";
import {
  planEvent,
  createEvent,
  getMyEvents,
  getEventById,
} from "../controllers/event.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const planRules = [
  body("categories").isArray({ min: 1 }).withMessage("Pick at least one service category"),
  body("totalBudget").isFloat({ gt: 0 }).withMessage("Budget must be greater than 0"),
];

const createRules = [
  body("title").trim().notEmpty().withMessage("Event title is required"),
  body("eventDate")
    .notEmpty().withMessage("Event date is required")
    .isISO8601().withMessage("Event date must be a valid date"),
  body("items").isArray({ min: 1 }).withMessage("Select at least one service to book"),
];

// All event routes require login.
router.use(protect);

router.post("/plan", planRules, planEvent); // any authenticated user can plan
router.post("/",     authorize("buyer"), createRules, createEvent);
router.get ("/my",   getMyEvents);
router.get ("/:id",  authorize("buyer", "admin", "superadmin"), getEventById);

export default router;
