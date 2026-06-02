// controllers/auth.controller.js
// register · login · getMe · updateProfile · changePassword
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import generateToken from "../utils/generateToken.js";

// ── Helper: strip password before sending to client ──────────
const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

// ── @POST /api/auth/register ──────────────────────────────────
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Prevent public creation of admin / superadmin accounts
    const safeRole = ["buyer", "seller"].includes(role) ? role : "buyer";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role:         safeRole,
        sellerStatus: safeRole === "seller" ? "pending" : "none",
      },
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/auth/login ─────────────────────────────────────
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account has been suspended" });
    }

    const token = generateToken(user.id);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @GET /api/auth/me  (protected) ───────────────────────────
export const getMe = async (req, res) => {
  // req.user is set by protect middleware
  return res.json({ success: true, user: sanitizeUser(req.user) });
};

// ── @PUT /api/auth/profile  (protected) ──────────────────────
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, phone, location, bio, avatar } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name     !== undefined && { name }),
        ...(phone    !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(bio      !== undefined && { bio }),
        ...(avatar   !== undefined && { avatar }),
      },
    });

    return res.json({ success: true, user: sanitizeUser(updated) });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @POST /api/auth/become-seller  (protected) ───────────────
// Accepts application form data and upserts the VendorProfile so
// admins see real business details, and sellers can create gigs
// immediately after approval without a separate profile-creation step.
export const becomeSeller = async (req, res) => {
  const {
    businessName,
    categories = [],   // array from the form (e.g. ["photography","music"])
    location   = "",
    phone      = "",
    bio        = "",
  } = req.body;

  try {
    // Use first selected category as the primary category field
    const primaryCategory = Array.isArray(categories) && categories.length
      ? categories[0]
      : "General";

    const [user] = await prisma.$transaction([
      // Update User role + also store phone/bio/location on User model
      prisma.user.update({
        where: { id: req.user.id },
        data:  {
          role:         "seller",
          sellerStatus: "pending",
          ...(phone    && { phone }),
          ...(bio      && { bio }),
          ...(location && { location }),
        },
      }),
      // Upsert VendorProfile with the business info from the form
      prisma.vendorProfile.upsert({
        where:  { userId: req.user.id },
        update: {
          ...(businessName && { businessName }),
          category:    primaryCategory,
          ...(location   && { location }),
          ...(bio        && { description: bio }),
        },
        create: {
          userId:       req.user.id,
          businessName: businessName || req.user.name,
          category:     primaryCategory,
          description:  bio,
          location,
          portfolio:    [],
        },
      }),
    ]);

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error("becomeSeller error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── @PUT /api/auth/change-password  (protected) ──────────────
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data:  { password: hashedNew },
    });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
