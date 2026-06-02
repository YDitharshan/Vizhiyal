// routes/auth.routes.js
import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  becomeSeller,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// ── Validation rules ──────────────────────────────────────────
const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 80 }).withMessage("Name must be 2–80 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["buyer", "seller"]).withMessage("Role must be buyer or seller"),
];

const loginRules = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage("Name must be 2–80 characters"),
  body("bio")
    .optional()
    .isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
];

const changePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

// ── Public routes ─────────────────────────────────────────────
router.post("/register", registerRules,  register);
router.post("/login",    loginRules,     login);

// ── Protected routes ──────────────────────────────────────────
router.get ("/me",              protect,                         getMe);
router.put ("/profile",         protect, updateProfileRules,     updateProfile);
router.put ("/change-password", protect, changePasswordRules,    changePassword);
router.post("/become-seller",   protect,                         becomeSeller);

export default router;
