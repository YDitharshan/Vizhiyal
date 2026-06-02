// routes/payout.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  updatePayoutStatus,
} from "../controllers/payout.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

const payoutRules = [
  body("amount")
    .isFloat({ min: 1 })
    .withMessage("Amount must be greater than 0"),
  body("bankName").trim().notEmpty().withMessage("Bank name is required"),
  body("accountNumber").trim().notEmpty().withMessage("Account number is required"),
  body("accountName").trim().notEmpty().withMessage("Account holder name is required"),
];

router.use(protect);

router.post  ("/",            authorize("seller"),                    payoutRules, requestPayout);
router.get   ("/my",          authorize("seller"),                                 getMyPayouts);
router.get   ("/all",         authorize("admin", "superadmin"),                    getAllPayouts);
router.patch ("/:id/status",  authorize("admin", "superadmin"),                    updatePayoutStatus);

export default router;
