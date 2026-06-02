// routes/promoCode.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  createPromo,
  listPromos,
  validatePromo,
  togglePromoStatus,
  deletePromo,
} from "../controllers/promoCode.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const promoRules = [
  body("code").trim().notEmpty().withMessage("Code is required"),
  body("discountType")
    .isIn(["percent", "flat"])
    .withMessage("Discount type must be percent or flat"),
  body("discountValue")
    .isFloat({ min: 0.01 })
    .withMessage("Discount value must be greater than 0"),
];

// Buyer — validate at checkout (protected but any role)
router.post("/validate", protect, validatePromo);

// Superadmin only
router.use(protect, authorize("superadmin"));
router.post  ("/",              promoRules,  createPromo);
router.get   ("/",                           listPromos);
router.patch ("/:id/status",                 togglePromoStatus);
router.delete("/:id",                        deletePromo);

export default router;
